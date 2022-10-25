<script>
import { message } from "ant-design-vue";
import "ant-design-vue/es/message/style/css";
import {
  // DragOutlined,
  DownOutlined,
  SwapOutlined,
} from "@ant-design/icons-vue";
import subscriptionJSON from "../assets/subscription.json";
import * as XLSX from "xlsx-js-style";
import draggable from "vuedraggable";
import axios from "axios";
import qs from "qs";

export default {
  props: {
    typeId: {
      type: Number,
    },
    productName: {
      type: String,
    },
  },
  components: {
    SwapOutlined,
    DownOutlined,
    // DragOutlined,
    draggable,
  },
  data() {
    return {
      isLoading: false,
      visible: false,
      showAddPlan: false,
      showSubscription: false,
      checkAll: true,
      indeterminate: false,
      newPayerName: "",
      newProductName: "",
      newName: "",
      subscriptionJson: {},
      chosenSubscriptionPlanId: "",
      hasSubscriptionValue: false,
      planList: [],
      chosenPlan: [],
      originalSelectionList: [],
      selectionList: [],
      listWithParentId: [],
      answerList: {},
      final: {},
      mergeAnswerList: {},
      mergeFinal: {},
      newRowName: { general: "" },
      newRowNameError: { general: "" },
      mode: "",
    };
  },
  mounted() {
    this.getPlans();
  },
  methods: {
    onCheckChange(e) {
      if (!e.target.checked) {
        this.checkAll = false;
      } else {
        let allChecked = true;
        this.planList.forEach((plan) => {
          if (!plan.checked) {
            allChecked = false;
          }
        });
        this.checkAll = allChecked;
      }
    },
    onCheckAllChange(e) {
      if (e.target.checked) {
        this.indeterminate = false;
        this.planList = this.planList.map((plan) => {
          return {
            ...plan,
            checked: true,
          };
        });
      } else {
        this.indeterminate = false;
        this.planList = this.planList.map((plan) => {
          return {
            ...plan,
            checked: false,
          };
        });
      }
    },
    setSelected(value, planId, selectionName) {
      this.final[planId][selectionName] = value;
    },
    setMergeSelected(value, planId, mergeId) {
      this.mergeFinal[planId][mergeId] = value;
    },
    toggleAddPlan() {
      this.newPayerName = "";
      this.newProductName = "";
      this.newName = "";
      this.showAddPlan = true;
    },
    showModal(mode) {
      this.mode = mode;
      this.visible = true;
    },
    getPlans() {
      axios
        .get("/api/queryPlans", { params: { typeId: this.typeId } })
        .then((res) => {
          if (res.data.errno === 401) {
            message.error(res.data.errmsg);
          } else {
            this.planList = res.data.data.plans.map((plan) => {
              return {
                ...plan,
                checked: true,
              };
            });
          }
        });
    },
    filterOption(input, option) {
      return option.key.toLowerCase().indexOf(input.toLowerCase()) >= 0;
    },
    getDetails() {
      this.hasSubscriptionValue = false;
      this.isLoading = true;
      const planId = [];
      this.planList = this.planList.filter((item) => !item.isNew);
      this.planList.forEach((plan) => {
        if (plan.checked) {
          planId.push(plan.id);
        }
      });
      if (planId.length === 0) {
        // this.chosenPlan = [];
        this.isLoading = false;
      } else {
        axios
          .get("/api/queryItems", {
            params: { planId },
            paramsSerializer: function (params) {
              return qs.stringify(params, { arrayFormat: "repeat" });
            },
          })
          .then((res) => {
            if (res.data.errno === 401) {
              message.error(res.data.errmsg);
              this.isLoading = false;
            } else {
              const getChosenPlan = res.data.data.plans;
              this.originalSelectionList = res.data.data.items;
              this.selectionList = [];
              this.listWithParentId = [];
              const itemParents = res.data.data.itemParents;
              const final = {};
              const answerList = {};
              const mergeFinal = {};
              const mergeAnswerList = {};
              res.data.data.items.forEach((item) => {
                item.active = true;
                getChosenPlan.forEach((plan) => {
                  if (
                    subscriptionJSON[plan.id] &&
                    this.hasSubscriptionValue === false
                  ) {
                    this.hasSubscriptionValue = true;
                    this.subscriptionJson = subscriptionJSON;
                  }
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
                        if (
                          mergeAnswerList[id][item.mergeIds[id]].indexOf(
                            valueItem.value
                          ) === -1
                        ) {
                          mergeAnswerList[id][item.mergeIds[id]].push(
                            valueItem.value
                          );
                        }
                      } else {
                        mergeAnswerList[id][item.mergeIds[id]] = [
                          valueItem.value,
                        ];
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

              this.chosenPlan = getChosenPlan;
              this.answerList = answerList;
              this.final = final;
              this.mergeAnswerList = mergeAnswerList;
              this.mergeFinal = mergeFinal;
              this.isLoading = false;
            }
          });
      }
    },
    addNewRow(parentId) {
      if (parentId) {
        const newRowNameStr = this.newRowName[parentId];
        if (newRowNameStr) {
          this.listWithParentId.forEach((item) => {
            if (parentId === item.parentId) {
              const lastSeq =
                item.selectionList[item.selectionList.length - 1].seq;
              item.selectionList.push({
                name: newRowNameStr,
                values: [],
                active: true,
                parentId,
                seq: lastSeq + 1,
              });
            }
          });
        } else {
          this.newRowNameError[parentId] = "请输入有效列行名";
        }
      } else {
        if (this.newRowName.general) {
          this.newRowNameError.general = "";
          const lastSeq = this.selectionList[this.selectionList.length - 1].seq;
          const newValue = {
            name: this.newRowName.general,
            values: [],
            active: true,
            seq: lastSeq + 1,
          };
          this.selectionList = [...this.selectionList, newValue];
          this.newRowName.general = "";
        } else {
          this.newRowNameError.general = "请输入有效列行名";
        }
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
    addPlan() {
      const newPlanId = new Date().valueOf();
      const planObj = {
        id: newPlanId,
        payer: this.newPayerName,
        productName: this.newProductName,
        name: this.newName,
        isNew: true,
        checked: true,
      };
      this.originalSelectionList.forEach((item) => {
        const values = item.values.map((item) => item.value);
        this.answerList[item.name][newPlanId] = values;
      });
      this.final[planObj.id] = {};
      this.mergeFinal[planObj.id] = {};
      this.planList.unshift(planObj);
      this.chosenPlan.unshift(planObj);
      this.showAddPlan = false;
    },
    saveAnswers() {
      const postPlan = [];
      const postData = [];
      let allSelection = [...this.selectionList];
      this.listWithParentId.forEach((list) => {
        allSelection = [...allSelection, ...list.selectionList];
      });
      this.chosenPlan.forEach(({ id, payer, productName, name, isNew }) => {
        if (isNew) {
          postPlan.push({
            id,
            payer,
            productName,
            name,
            typeId: this.typeId,
          });
        }

        allSelection.forEach(({ seq, mergeIds, name, parentId }) => {
          if (mergeIds && mergeIds[id]) {
            const answer = this.mergeFinal[id][mergeIds[id]];
            if (this.mergeAnswerList[id][mergeIds[id]].indexOf(answer) > -1) {
              console.log("merge answer exists");
            } else {
              postData.push({
                planId: id,
                name,
                value: answer,
                parentId,
                mergeId: mergeIds[id],
                seq,
              });
            }
          } else {
            const answer = this.final[id][name];
            if (answer) {
              if (
                this.answerList[name] &&
                this.answerList[name][id].indexOf(answer) > -1 &&
                !isNew
              ) {
                console.log("answer exists");
              } else {
                postData.push({
                  planId: id,
                  name,
                  value: answer,
                  parentId,
                  seq,
                });
              }
            }
          }
        });
      });
      if (postData.length > 0) {
        axios({
          url: "/api/updateItems",
          method: "post",
          data: { plans: postPlan, items: postData },
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

      mergesData.push({
        s: { r: 0, c: 0 },
        e: { r: 0, c: this.chosenPlan.length },
      });
      rowDataList.push([
        {
          v: ``,
          t: "s",
          s: {
            fill: { patternType: "solid", fgColor: { theme: 3 } },
            alignment: { horizontal: "center" },
            font: {
              sz: 12,
              bold: true,
              name: "Cambria",
              color: { theme: 2 },
            },
          },
        },
        ...this.chosenPlan.map((plan) => {
          return {
            v: `${plan.payer}${plan.productName}${
              plan.name ? "-" + plan.name : ""
            }`,
            t: "s",
            s: {
              fill: { patternType: "solid", fgColor: { theme: 3 } },
              alignment: { horizontal: "center" },
              font: {
                sz: 12,
                bold: true,
                name: "Cambria",
                color: { theme: 2 },
              },
            },
          };
        }),
      ]);
      const dataProcess = (selectionList, parentName) => {
        if (parentName) {
          rowDataList.push([
            {
              v: parentName,
              t: "s",
              s: {
                fill: { patternType: "solid", fgColor: { theme: 4 } },
                alignment: { horizontal: "center" },
                font: {
                  bold: true,
                  sz: 12,
                  wrapText: true,
                  name: "Cambria",
                  color: { theme: 2 },
                },
              },
            },
          ]);
          mergesData.push({
            s: { r: rowDataList.length, c: 0 },
            e: { r: rowDataList.length, c: this.chosenPlan.length },
          });
        }
        const filteredSelectionList = selectionList.filter((item) => {
          return item.active;
        });
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
            let currentValue = this.final[plan.id][valueItem.name];
            let currentMergeId = null;
            let nextMergeId = null;
            let previousMergeId = null;
            if (valueItem.mergeIds && valueItem.mergeIds[plan.id]) {
              currentMergeId = valueItem.mergeIds[plan.id];
              currentValue =
                this.mergeFinal[plan.id][valueItem.mergeIds[plan.id]];
            }
            if (
              filteredSelectionList[row + 1] &&
              filteredSelectionList[row + 1].mergeIds &&
              filteredSelectionList[row + 1].mergeIds[plan.id]
            ) {
              nextMergeId = filteredSelectionList[row + 1].mergeIds[plan.id];
            }
            if (
              filteredSelectionList[row - 1] &&
              filteredSelectionList[row - 1].mergeIds &&
              filteredSelectionList[row - 1].mergeIds[plan.id]
            ) {
              previousMergeId =
                filteredSelectionList[row - 1].mergeIds[plan.id];
            }

            if (
              nextMergeId &&
              currentMergeId &&
              nextMergeId === currentMergeId
            ) {
              if (!merges[col + 1]) {
                merges[col + 1] = {
                  s: { r: rowDataList.length + 1, c: col + 1 },
                };
              }
            } else if (
              previousMergeId &&
              currentMergeId &&
              previousMergeId === currentMergeId
            ) {
              merges[col + 1].e = { r: rowDataList.length + 1, c: col + 1 };
              mergesData.push(merges[col + 1]);
              merges[col + 1] = null;
            }
            // const lastValue = filteredSelectionList[row - 1]
            //   ? this.final[plan.id][filteredSelectionList[row - 1].name]
            //   : null;
            // const nextValue = filteredSelectionList[row + 1]
            //   ? this.final[plan.id][filteredSelectionList[row + 1].name]
            //   : null;
            // if (nextValue === currentValue) {
            //   if (!merges[col + 1]) {
            //     merges[col + 1] = { s: { r: row + 2, c: col + 1 } };
            //   }
            // } else if (lastValue === currentValue) {
            //   merges[col + 1].e = { r: row + 2, c: col + 1 };
            //   mergesData.push(merges[col + 1]);
            //   merges[col + 1] = null;
            // }
            rowData.push({
              v: currentValue,
              t: "s",
              s: { alignment: { vertical: "center", wrapText: true } },
            });
          });
          rowDataList.push(rowData);
        });
      };
      dataProcess(this.selectionList);
      this.listWithParentId.forEach((item) => {
        dataProcess(item.selectionList, item.name);
      });
      if (this.hasSubscriptionValue) {
        dataProcess(
          [{ name: "费率", active: true }],
          "保单费率 (RMB ¥ 人民币)"
        );
      }
      const ws = XLSX.utils.json_to_sheet([]);
      XLSX.utils.sheet_add_aoa(
        ws,
        [
          [
            {
              v: this.productName,
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
    <div class="main-container">
      <div class="inner-container">
        <div class="side-bar">
          <div class="side-bar-selections">
            <a-checkbox
              style="margin-left: 8px"
              :indeterminate="indeterminate"
              v-model:checked="checkAll"
              @change="onCheckAllChange"
            >
              全选
            </a-checkbox>
            <a-checkbox
              v-for="(option, x) in planList"
              :key="x"
              v-model:checked="option.checked"
              @change="onCheckChange"
            >
              {{
                `${option.payer}${option.name ? `-${option.name}` : ""}${
                  option.productName ? `-${option.productName}` : ""
                }`
              }}
            </a-checkbox>
          </div>
          <div class="side-bar-buttons">
            <a-button
              type="primary"
              class="export-button"
              @click="getDetails"
              :loading="isLoading"
              >获取计划</a-button
            >
            <a-button
              type="primary"
              class="export-button"
              @click="() => showModal('EXPORT')"
              >导出列表</a-button
            >
            <a-button
              v-if="chosenPlan.length > 0"
              type="primary"
              class="export-button"
              @click="() => showModal('SAVE')"
              >储存选项</a-button
            >
          </div>
        </div>
        <div class="scroll-container">
          <div class="title-container">
            <a-button
              v-if="chosenPlan.length > 0"
              type="primary"
              size="small"
              @click="toggleAddPlan"
              class="add-plan-button"
            >
              添加计划
            </a-button>
            <draggable
              v-model="chosenPlan"
              item-key="name"
              handle=".handle"
              class="title-inner-container"
            >
              <template #item="{ element }">
                <div class="title-item">
                  <swap-outlined class="handle" />
                  {{
                    `${element.payer}${element.name ? `-${element.name}` : ""}${
                      element.productName ? `-${element.productName}` : ""
                    }`
                  }}
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
                  <!-- <drag-outlined class="handle" style="margin-top: 8px" /> -->
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
                      <a-tooltip>
                        <template
                          v-if="mergeFinal[plan.id][element.mergeIds[plan.id]]"
                          #title
                          >{{
                            mergeFinal[plan.id][element.mergeIds[plan.id]]
                          }}</template
                        >
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
                      </a-tooltip>
                    </div>
                    <div class="value-column" v-else>
                      <a-tooltip>
                        <template v-if="final[plan.id][element.name]" #title>{{
                          final[plan.id][element.name]
                        }}</template>
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
                      </a-tooltip>
                    </div>
                  </div>
                  <div class="active-value-container">
                    <a-checkbox v-model:checked="element.active"></a-checkbox>
                  </div>
                </div>
              </template>
            </draggable>
            <div style="margin: 24px 0 0 12px" v-if="selectionList.length > 0">
              <a-input
                :style="{
                  width: '190px',
                  padding: '2px 2px 2px 11px',
                  'margin-right': '12px',
                }"
                placeholder="添加列行"
                v-model:value="newRowName.general"
              />
              <a-button type="primary" size="small" @click="() => addNewRow()">
                添加
              </a-button>
              <p class="new-row-name-error">{{ newRowNameError.general }}</p>
            </div>
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
                    <!-- <drag-outlined class="handle" style="margin-top: 8px" /> -->
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
                        <a-tooltip>
                          <template
                            v-if="
                              mergeFinal[plan.id][element.mergeIds[plan.id]]
                            "
                            #title
                            >{{
                              mergeFinal[plan.id][element.mergeIds[plan.id]]
                            }}</template
                          >
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
                        </a-tooltip>
                      </div>
                      <div class="value-column" v-else>
                        <a-tooltip>
                          <template
                            v-if="final[plan.id][element.name]"
                            #title
                            >{{ final[plan.id][element.name] }}</template
                          >
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
                        </a-tooltip>
                      </div>
                    </div>
                    <div class="active-value-container">
                      <a-checkbox v-model:checked="element.active"></a-checkbox>
                    </div>
                  </div>
                </template>
              </draggable>
              <div
                style="margin: 24px 0 0 12px"
                v-if="selectionList.length > 0"
              >
                <a-input
                  :style="{
                    width: '190px',
                    padding: '2px 2px 2px 11px',
                    'margin-right': '12px',
                  }"
                  placeholder="添加列行"
                  v-model:value="newRowName[parentGroup.parentId]"
                />
                <a-button
                  type="primary"
                  size="small"
                  @click="() => addNewRow(parentGroup.parentId)"
                >
                  添加
                </a-button>
                <p class="new-row-name-error">
                  {{ newRowNameError[parentGroup.parentId] }}
                </p>
              </div>
            </div>
            <div v-if="hasSubscriptionValue">
              <div class="group-title">保单费率</div>
              <div class="selection-row">
                <div class="value-title">费率</div>
                <div
                  class="input-container"
                  v-for="(plan, y) in chosenPlan"
                  :key="y"
                >
                  <div class="value-column">
                    <a-tooltip>
                      <template v-if="final[plan.id].费率" #title>{{
                        final[plan.id].费率
                      }}</template>
                      <a-input
                        :style="{
                          width: '190px',
                          padding: '2px 2px 2px 11px',
                        }"
                        v-model:value="final[plan.id].费率"
                      >
                        <template #suffix>
                          <a-button
                            v-if="subscriptionJson[plan.id]"
                            type="text"
                            @click="
                              () => {
                                this.chosenSubscriptionPlanId = plan.id;
                                this.showSubscription = true;
                              }
                            "
                          >
                            费率表
                          </a-button>
                          <div v-else style="height: 32px; width: 1px"></div>
                        </template>
                      </a-input>
                    </a-tooltip>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <a-modal
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
    <a-modal
      v-model:visible="showAddPlan"
      :wrap-style="{ overflow: 'hidden' }"
      title="添加计划"
      :footer="null"
    >
      <div class="modal-container">
        <a-input
          style="margin-bottom: 12px"
          v-model:value="newPayerName"
          placeholder="保险公司"
        ></a-input>
        <a-input
          style="margin-bottom: 12px"
          v-model:value="newProductName"
          placeholder="产品名称"
        ></a-input>
        <a-input
          style="margin-bottom: 12px"
          v-model:value="newName"
          placeholder="计划类别"
        ></a-input>
        <div class="modal-button-row">
          <a-button style="margin-right: 8px" @click="showAddPlan = false">
            取消
          </a-button>
          <a-button type="primary" @click="addPlan"> 添加 </a-button>
        </div>
      </div>
    </a-modal>
    <a-modal
      v-model:visible="showSubscription"
      :wrap-style="{ overflow: 'hidden' }"
      title="选择费率"
      :footer="null"
    >
      <div class="sub-modal-container">
        <div class="list-container">
          <div
            class="selection-row"
            style="margin-bottom: 8px; border-bottom: 1px solid #f0f0f0"
          >
            <div class="sub-item">Age 年龄</div>
            <div class="sub-item">RMB ¥ 人民币</div>
          </div>
          <div
            class="selection-row"
            v-for="(item, i) in subscriptionJson[chosenSubscriptionPlanId]"
            :key="i"
          >
            <div class="sub-item">{{ item.age }}</div>
            <div class="sub-item">
              <a-button
                @click="
                  () => {
                    this.final[this.chosenSubscriptionPlanId].费率 =
                      item.value1;
                    this.showSubscription = false;
                  }
                "
                type="link"
              >
                {{ item.value1 }}
              </a-button>
            </div>
          </div>
        </div>
      </div>
    </a-modal>
  </main>
</template>

<style scoped>
.main-container {
  /* overflow-y: auto; */
  width: calc(100vw - 160px);
  height: calc(100vh - 46px);
}
.plan-select-container {
  padding: 0;
}
.inner-container {
  display: flex;
}
.side-bar {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 200px;
  min-width: 200px;
  border-right: solid 1px #f0f0f0;
  height: calc(100vh - 46px);
}
.side-bar-selections {
  overflow-y: auto;
  padding: 8px 0 100px;
  margin-bottom: 100px;
  display: flex;
  flex-direction: column;
}
.side-bar-buttons {
  position: absolute;
  bottom: 0px;
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 0 0 24px;
  background: white;
}
.export-button {
  margin: 12px 8px 0;
}
.scroll-container {
  overflow: auto;
  height: calc(100vh - 46px);
  width: calc(100vw - 360px);
}
.title-container {
  display: flex;
  flex-direction: row;
  height: 30px;
  margin-top: 16px;
}
.add-plan-button {
  margin-left: 14px;
}
.title-inner-container {
  display: flex;
  flex-direction: row;
  margin-left: 158px;
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
  height: 55px;
  background-color: #add8e6;
  padding-left: 10px;
  margin-right: 10px;
  padding-top: 2px;
}
.merge-title {
  font-size: 8px;
  line-height: 1;
  margin: 1px;
}
.value-column {
  padding-top: 12px;
  height: 55px;
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
.sub-modal-container {
  height: 60vh;
  overflow-y: scroll;
}
.sub-item {
  width: 45%;
  text-align: center;
}
</style>
