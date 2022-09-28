<script>
import {
  DragOutlined,
  DownOutlined,
  SwapOutlined,
} from "@ant-design/icons-vue";
import * as XLSX from "xlsx-js-style";
import draggable from "vuedraggable";
import axios from "axios";
import qs from "qs";

export default {
  components: {
    SwapOutlined,
    DownOutlined,
    DragOutlined,
    draggable,
  },
  data() {
    return {
      visible: false,
      planList: [],
      plan: [],
      chosenPlan: [],
      selectionList: [],
      listWithParentId: [],
      answerList: {},
      final: {},
      mergeAnswerList: {},
      mergeFinal: {},
      header: [],
      rowData: [],
      newRowName: "",
      newRowNameError: "",
      mode: "",
      activeKey: 0,
    };
  },
  mounted() {
    this.getPlans();
  },
  methods: {
    setSelected(value, planId, selectionName) {
      this.final[planId][selectionName] = value;
    },
    setMergeSelected(value, planId, mergeId) {
      this.mergeFinal[planId][mergeId] = value;
    },
    showModal(mode) {
      this.mode = mode;
      this.visible = true;
    },
    getPlans() {
      axios.get("/api/queryPlans").then((res) => {
        this.planList = res.data.data.plans;
      });
    },
    filterOption(input, option) {
      return option.key.toLowerCase().indexOf(input.toLowerCase()) >= 0;
    },
    getDetails() {
      const planId = [];
      Object.keys(this.plan).forEach((key) => {
        planId.push(this.plan[key]);
      });
      axios
        .get("/api/queryItems", {
          params: { planId },
          paramsSerializer: function (params) {
            return qs.stringify(params, { arrayFormat: "repeat" });
          },
        })
        .then((res) => {
          this.chosenPlan = res.data.data.plans;
          this.selectionList = [];
          this.listWithParentId = [];
          const itemParents = res.data.data.itemParents;
          const final = {};
          const answerList = {};
          const mergeFinal = {};
          const mergeAnswerList = {};
          res.data.data.items.forEach((item) => {
            item.active = true;
            this.chosenPlan.forEach((plan) => {
              if (item.mergeIds && item.mergeIds[plan.id]) {
                if (!mergeFinal[plan.id]) {
                  mergeFinal[plan.id] = {};
                  mergeFinal[plan.id][item.mergeIds[plan.id]] = "";
                }
              } else {
                if (!final[plan.id]) {
                  final[plan.id] = {};
                }
                final[plan.id][item.name] = "";
              }
            });
            answerList[item.name] = {};
            item.values.forEach((valueItem) => {
              valueItem.planIds.forEach((id) => {
                if (item.mergeIds && item.mergeIds[id]) {
                  if (!mergeFinal[id][item.mergeIds[id]]) {
                    mergeFinal[id][item.mergeIds[id]] = valueItem.value;
                  }
                  if (!mergeAnswerList[id]) {
                    mergeAnswerList[id] = {};
                  }
                  if (mergeAnswerList[id][item.mergeIds[id]]) {
                    mergeAnswerList[id][item.mergeIds[id]].push(
                      valueItem.value
                    );
                  } else {
                    mergeAnswerList[id][item.mergeIds[id]] = [valueItem.value];
                  }
                } else {
                  if (!final[id][item.name]) {
                    final[id][item.name] = valueItem.value;
                  }
                  if (answerList[item.name][id]) {
                    answerList[item.name][id].push(valueItem.value);
                  } else {
                    answerList[item.name][id] = [valueItem.value];
                  }
                }
              });
            });
            if (item.parentId) {
              let newParentItem = {};
              this.listWithParentId.forEach((parentItem) => {
                if (parentItem.parentId === item.parentId) {
                  newParentItem = parentItem;
                }
              });

              if (newParentItem.parentId) {
                newParentItem.selectionList.push(item);
              } else {
                for (let x = 0; x < itemParents.length; x++) {
                  if (itemParents[x].id === item.parentId) {
                    newParentItem = {
                      parentId: itemParents[x].id,
                      name: itemParents[x].name,
                      selectionList: [item],
                    };
                    this.listWithParentId.push(newParentItem);
                    break;
                  }
                }
              }
            } else {
              this.selectionList.push(item);
            }
          });

          this.answerList = answerList;
          this.final = final;
          this.mergeAnswerList = mergeAnswerList;
          this.mergeFinal = mergeFinal;
          console.log(this.answerList, this.final, this.listWithParentId, mergeAnswerList, mergeFinal);
        });
    },
    addNewRow() {
      if (this.newRowName) {
        this.newRowNameError = "";
        const newValue = {
          name: this.newRowName,
          values: [],
          active: true,
        };
        this.selectionList = [...this.selectionList, newValue];
        this.newRowName = "";
      } else {
        this.newRowNameError = "请输入有效列行名";
      }
    },
    checkIfHaveValue(item, plan) {
      let show = false;
      item.values.forEach((value) => {
        if (value.planIds.indexOf(plan.id) >= 0) {
          show = true;
        }
      });
      return show;
    },
    saveAnswers() {
      const postData = [];
      this.selectionList.forEach(({ name }) => {
        this.chosenPlan.forEach(({ id }) => {
          const answer = this.final[id][name];
          if (answer) {
            if (this.answerList[name][id].indexOf(answer) > -1) {
              console.log("answer exists");
            } else {
              postData.push({
                planId: id,
                name,
                value: answer,
                seq: this.answerList[name][id].length,
              });
            }
          }
        });
      });
      if (postData.length > 0) {
        axios({
          url: "/api/plan/items",
          method: "post",
          data: { items: postData },
          header: {
            "Content-Type": "application/json",
          },
        }).then(() => {
          this.visible = false;
        });
      } else {
        this.visible = false;
      }
    },
    exportExcel() {
      const rowDataList = [];
      const merges = {};
      const mergesData = [];
      const filteredSelectionList = this.selectionList.filter((item) => {
        return item.active;
      });
      mergesData.push({
        s: { r: 0, c: 0 },
        e: { r: 0, c: this.chosenPlan.length },
      });
      rowDataList.push([
        " ",
        ...this.chosenPlan.map((plan) => {
          return {
            v: `${plan.name} - ${plan.productName}`,
            t: "s",
            s: {
              alignment: { horizontal: "center" },
              font: { sz: 12, bold: true, name: "Cambria" },
            },
          };
        }),
      ]);
      filteredSelectionList.forEach((valueItem, row) => {
        const rowData = [
          {
            v: valueItem.name,
            t: "s",
            s: {
              font: { bold: true, sz: 12, wrapText: true, name: "Cambria" },
            },
          },
        ];
        this.chosenPlan.forEach((plan, col) => {
          const currentValue = this.final[plan.id][valueItem.name];
          const lastValue = filteredSelectionList[row - 1]
            ? this.final[plan.id][filteredSelectionList[row - 1].name]
            : null;
          const nextValue = filteredSelectionList[row + 1]
            ? this.final[plan.id][filteredSelectionList[row + 1].name]
            : null;
          if (nextValue === currentValue) {
            if (!merges[col + 1]) {
              merges[col + 1] = { s: { r: row + 2, c: col + 1 } };
            }
          } else if (lastValue === currentValue) {
            merges[col + 1].e = { r: row + 2, c: col + 1 };
            mergesData.push(merges[col + 1]);
            merges[col + 1] = null;
          }
          rowData.push({
            v: currentValue,
            t: "s",
            s: { alignment: { vertical: "center", wrapText: true } },
          });
        });
        rowDataList.push(rowData);
      });
      this.rowData = rowDataList;
      const ws = XLSX.utils.json_to_sheet([]);
      XLSX.utils.sheet_add_aoa(
        ws,
        [
          [
            {
              v: "保险医疗计划",
              t: "s",
              s: {
                alignment: { horizontal: "center", vertical: "center" },
                font: { sz: 16, bold: true, name: "Cambria" },
              },
            },
          ],
        ],
        {
          origin: "A1",
        }
      );
      XLSX.utils.sheet_add_aoa(ws, rowDataList, {
        origin: "A2",
      });
      ws["!merges"] = mergesData;
      ws["!rows"] = [{ hpt: 30 }];
      ws["!cols"] = [
        { wch: 40 },
        ...this.chosenPlan.map(() => {
          return { wch: 30 };
        }),
      ];
      const myWorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(myWorkBook, ws, "Sheet1");
      XLSX.writeFile(myWorkBook, "保险医疗计划.xlsx");
      this.visible = false;
    },
  },
};
</script>

<template>
  <main>
    <div class="scroll-container">
      <div class="plan-select-container">
        <a-select
          :style="{ width: '560px' }"
          v-model:value="plan"
          show-search
          mode="multiple"
          placeholder="请选择计划"
          :filter-option="filterOption"
        >
          <a-select-option
            v-for="(option, x) in planList"
            :key="`${option.payer}-${option.name}-${option.productName}-${x}`"
            :value="option.id"
          >
            {{ `${option.payer}-${option.name}-${option.productName}` }}
          </a-select-option>
        </a-select>
        <a-button type="primary" style="margin-left: 8px" @click="getDetails"
          >获取计划信息</a-button
        >
        <a-button
          type="primary"
          class="export-button"
          @click="() => showModal('EXPORT')"
          >导出列表</a-button
        >
        <a-button
          type="primary"
          class="export-button"
          @click="() => showModal('SAVE')"
          >储存选项</a-button
        >
      </div>
      <div class="title-container">
        <draggable
          v-model="chosenPlan"
          item-key="name"
          handle=".handle"
          class="title-inner-container"
        >
          <template #item="{ element }">
            <div class="title-item">
              <swap-outlined class="handle" />
              {{ `${element.name} - ${element.productName}` }}
            </div>
          </template>
        </draggable>
        <div v-if="chosenPlan.length > 0" class="active-title-container">
          是否显示
        </div>
      </div>
      <div class="content-container">
        <draggable v-model="selectionList" item-key="name" handle=".handle">
          <template #item="{ element }">
            <div class="selection-row">
              <drag-outlined class="handle" style="margin-top: 8px" />
              <div class="value-title">{{ element.name }}</div>
              <div
                class="input-container"
                v-for="(plan, y) in chosenPlan"
                :key="y"
              >
                <div
                  v-if="
                    element.mergeIds &&
                    element.mergeIds[plan.id] &&
                    mergeFinal[plan.id]
                  "
                  class="merge-value-column"
                >
                  <div class="merge-title">
                    合并号：{{ element.mergeIds[plan.id] }}
                  </div>
                  <a-input
                    :style="{
                      width: '190px',
                      padding: '2px 2px 2px 11px',
                    }"
                    v-model:value="
                      mergeFinal[plan.id][element.mergeIds[plan.id]]
                    "
                  >
                    <template #suffix>
                      <a-dropdown>
                        <template #overlay>
                          <a-menu
                            @click="
                              ({ key }) =>
                                setMergeSelected(
                                  key,
                                  plan.id,
                                  element.mergeIds[plan.id]
                                )
                            "
                          >
                            <a-menu-item
                              v-for="value in mergeAnswerList[plan.id][
                                element.mergeIds[plan.id]
                              ]"
                              :key="value"
                            >
                              {{ value }}
                            </a-menu-item>
                          </a-menu>
                        </template>
                        <a-button type="text">
                          <DownOutlined />
                        </a-button>
                      </a-dropdown>
                    </template>
                  </a-input>
                </div>
                <div class="value-column" v-else>
                  <a-input
                    :style="{
                      width: '190px',
                      padding: '2px 2px 2px 11px',
                    }"
                    v-model:value="final[plan.id][element.name]"
                  >
                    <template #suffix>
                      <a-dropdown>
                        <template #overlay>
                          <a-menu
                            @click="
                              ({ key }) =>
                                setSelected(key, plan.id, element.name)
                            "
                          >
                            <a-menu-item
                              v-for="value in answerList[element.name][plan.id]"
                              :key="value"
                            >
                              {{ value }}
                            </a-menu-item>
                          </a-menu>
                        </template>
                        <a-button type="text">
                          <DownOutlined />
                        </a-button>
                      </a-dropdown>
                    </template>
                  </a-input>
                </div>
              </div>
              <div class="active-value-container">
                <a-checkbox v-model:checked="element.active"></a-checkbox>
              </div>
            </div>
          </template>
        </draggable>
        <div
          v-for="parentGroup in listWithParentId"
          :key="parentGroup.parentId"
        >
          <div class="group-title">{{ parentGroup.name }}</div>
          <draggable
            v-model="parentGroup.selectionList"
            item-key="name"
            handle=".handle"
          >
            <template #item="{ element }">
              <div class="selection-row">
                <drag-outlined class="handle" style="margin-top: 8px" />
                <div class="value-title">{{ element.name }}</div>
                <div
                  class="input-container"
                  v-for="(plan, y) in chosenPlan"
                  :key="y"
                >
                  <div
                    v-if="
                      element.mergeIds &&
                      element.mergeIds[plan.id] &&
                      mergeFinal[plan.id]
                    "
                    class="merge-value-column"
                  >
                    <div class="merge-title">
                      合并号：{{ element.mergeIds[plan.id] }}
                    </div>
                    <a-input
                      :style="{
                        width: '190px',
                        padding: '2px 2px 2px 11px',
                      }"
                      v-model:value="
                        mergeFinal[plan.id][element.mergeIds[plan.id]]
                      "
                    >
                      <template #suffix>
                        <a-dropdown>
                          <template #overlay>
                            <a-menu
                              @click="
                                ({ key }) =>
                                  setMergeSelected(
                                    key,
                                    plan.id,
                                    element.mergeIds[plan.id]
                                  )
                              "
                            >
                              <a-menu-item
                                v-for="value in mergeAnswerList[plan.id][
                                  element.mergeIds[plan.id]
                                ]"
                                :key="value"
                              >
                                {{ value }}
                              </a-menu-item>
                            </a-menu>
                          </template>
                          <a-button type="text">
                            <DownOutlined />
                          </a-button>
                        </a-dropdown>
                      </template>
                    </a-input>
                  </div>
                  <div class="value-column" v-else>
                    <a-input
                      :style="{
                        width: '190px',
                        padding: '2px 2px 2px 11px',
                      }"
                      v-model:value="final[plan.id][element.name]"
                    >
                      <template #suffix>
                        <a-dropdown>
                          <template #overlay>
                            <a-menu
                              @click="
                                ({ key }) =>
                                  setSelected(key, plan.id, element.name)
                              "
                            >
                              <a-menu-item
                                v-for="value in answerList[element.name][
                                  plan.id
                                ]"
                                :key="value"
                              >
                                {{ value }}
                              </a-menu-item>
                            </a-menu>
                          </template>
                          <a-button type="text">
                            <DownOutlined />
                          </a-button>
                        </a-dropdown>
                      </template>
                    </a-input>
                  </div>
                </div>
                <div class="active-value-container">
                  <a-checkbox v-model:checked="element.active"></a-checkbox>
                </div>
              </div>
            </template>
          </draggable>
        </div>
        <div v-if="selectionList.length > 0">
          <a-input
            :style="{
              width: '190px',
              padding: '2px 2px 2px 11px',
              'margin-right': '12px',
            }"
            placeholder="添加列行"
            v-model:value="newRowName"
          />
          <a-button type="primary" size="small" @click="addNewRow">
            添加
          </a-button>
          <p class="new-row-name-error">{{ newRowNameError }}</p>
        </div>
      </div>
    </div>

    <a-modal
      ref="modalRef"
      v-model:visible="visible"
      :wrap-style="{ overflow: 'hidden' }"
      :title="null"
      :footer="null"
    >
      <div class="modal-container">
        <p v-if="mode === 'EXPORT'">确定下载Excel？</p>
        <p v-if="mode === 'SAVE'">确定储存选项？</p>
        <div class="modal-button-row">
          <a-button style="margin-right: 8px" @click="visible = false">
            取消
          </a-button>
          <a-button
            v-if="mode === 'EXPORT'"
            type="primary"
            @click="exportExcel"
          >
            确定下载
          </a-button>
          <a-button v-if="mode === 'SAVE'" type="primary" @click="saveAnswers">
            确定储存
          </a-button>
        </div>
      </div>
    </a-modal>
  </main>
</template>

<style scoped>
.scroll-container {
  overflow-y: auto;
  width: 100%;
}
.plan-select-container {
  padding: 0 24px 24px;
}
.export-button {
  margin-left: 12px;
}
.title-container {
  display: flex;
  flex-direction: row;
  margin-left: 282px;
  height: 30px;
}
.title-inner-container {
  display: flex;
  flex-direction: row;
}
.title-item {
  width: 232px;
  text-align: left;
}
.active-title-container {
  min-width: 100px;
  width: 100px;
  padding-left: 12px;
  /* text-align: center; */
}
.active-value-container {
  min-width: 100px;
  width: 70px;
  text-align: center;
}
.content-container {
  margin-left: 24px;
  padding-bottom: 48px;
}
.selection-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 0;
}
.group-title {
  font-weight: 500;
  margin: 32px 0 18px 12px;
  padding: 0 12px;
  border-bottom: solid 1px black;

  width: fit-content;
}
.value-title {
  min-width: 200px;
  max-width: 200px;
  width: 200px;
  text-align: left;
  margin: 8px 16px 0;
}
.input-container {
  min-width: 220px;
  max-width: 220px;
  width: 220px;
  margin: 0 12px 0 0;
}
.merge-value-column {
  height: 70px;
  background-color: #add8e6;
  padding-left: 10px;
  margin-right: 10px;
  padding-top: 2px;
}
.merge-title {
  font-size: 10px;
  line-height: 1;
  margin: 4px;
}
.value-column {
  padding-top: 22px;
  height: 70px;
  padding-left: 10px;
  margin-right: 10px;
}
.modal-container {
  margin: 24px 24px 6px 24px;
}
.modal-button-row {
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
}
.new-row-name-error {
  color: red;
}
</style>
