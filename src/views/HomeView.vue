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

const products = [
  { name: "高端医疗产品", id: 0 },
  { name: "含孕产", id: 1 },
  { name: "高端医疗出单规则", id: 2 },
];

export default {
  components: {
    SwapOutlined,
    DownOutlined,
    DragOutlined,
    draggable,
  },

  data() {
    return {
      productList: products,
      chosenProduct: [],
      visible: false,
      planList: [],
      plan: [],
      chosenPlan: [],
      selectionList: [],
      answerList: {},
      final: {},
      header: [],
      rowData: [],
      newRowName: "",
      newRowNameError: "",
      mode: "",
    };
  },
  mounted() {
    this.getPlans();
  },
  methods: {
    setSelected(value, planId, selectionName) {
      this.final[planId][selectionName] = value;
    },
    showModal(mode) {
      this.mode = mode;
      this.visible = true;
    },
    getPlans() {
      axios.get("/api/plans").then((res) => {
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
        .get("api/plan/items", {
          params: { planId },
          paramsSerializer: function (params) {
            return qs.stringify(params, { arrayFormat: "repeat" });
          },
        })
        .then((res) => {
          this.chosenPlan = res.data.data.plans;
          this.selectionList = res.data.data.items;
          const final = {};
          const answerList = {};
          this.selectionList.forEach((item, i) => {
            this.selectionList[i].active = true;
            this.chosenPlan.forEach((plan) => {
              if (!final[plan.id]) {
                final[plan.id] = {};
              }
              final[plan.id][item.name] = "";
            });
            answerList[item.name] = {};
            item.values.forEach((valueItem) => {
              valueItem.planIds.forEach((id) => {
                if (!final[id][item.name]) {
                  final[id][item.name] = valueItem.value;
                }
                if (answerList[item.name][id]) {
                  answerList[item.name][id].push(valueItem.value);
                } else {
                  answerList[item.name][id] = [valueItem.value];
                }
              });
            });
          });
          this.answerList = answerList;
          this.final = final;
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
          url: "api/plan/items",
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
    <div class="header">保险医疗计划方案模板</div>
    <div class="plan-select-container">
      <div>计划</div>
      <div style="margin: 12px 0 24px">
        <a-select
          :style="{ width: '400px' }"
          v-model:value="chosenProduct"
          mode="multiple"
          placeholder="请选择产品"
        >
          <a-select-option
            v-for="(option, x) in productList"
            :key="`${x}`"
            :value="option.id"
          >
            {{ `${option.name}` }}
          </a-select-option>
        </a-select>
      </div>
      <a-select
        :style="{ width: '400px' }"
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
          <div class="value-container">
            <drag-outlined class="handle" />
            <div class="value-title">{{ element.name }}</div>
            <div
              class="value-select-container"
              v-for="(plan, y) in chosenPlan"
              :key="y"
            >
              <div>
                <a-input
                  :style="{ width: '190px', padding: '2px 2px 2px 11px' }"
                  v-model:value="final[plan.id][element.name]"
                >
                  <template #suffix>
                    <a-dropdown>
                      <template #overlay>
                        <a-menu
                          @click="
                            ({ key }) => setSelected(key, plan.id, element.name)
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
.header {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 24px;
  font-size: 24px;
  font-weight: 500;
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
  margin-left: 254px;
}
.title-inner-container {
  display: flex;
  flex-direction: row;
}
.title-item {
  width: 200px;
  text-align: center;
}
.active-title-container {
  width: 100px;
  text-align: center;
}
.active-value-container {
  width: 70px;
  text-align: center;
}
.content-container {
  margin-left: 24px;
  padding-bottom: 48px;
}
.value-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 18px 0;
}
.value-title {
  width: 200px;
  text-align: left;
  margin: 0 16px;
}
.value-select-container {
  width: 200px;
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
