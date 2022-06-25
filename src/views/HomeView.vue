<script>
import { DragOutlined, DownOutlined } from "@ant-design/icons-vue";
import jsonExcel from "vue-json-excel3";
import draggable from "vuedraggable";
import axios from "axios";
import qs from "qs";

import "vue-select/dist/vue-select.css";

export default {
  components: {
    DownOutlined,
    DragOutlined,
    draggable,
    jsonExcel,
  },

  data() {
    return {
      visible: false,
      planList: [],
      plan: [],
      chosenPlan: [],
      selectionList: [],
      answerList: {},
      final: {},
      header: [],
      rowData: [],
    };
  },
  mounted() {
    this.getPlans();
  },
  methods: {
    setSelected(value, planId, selectionName) {
      this.final[planId][selectionName] = value;
    },
    showModal() {
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
    checkIfHaveValue(item, plan) {
      let show = false;
      item.values.forEach((value) => {
        if (value.planIds.indexOf(plan.id) >= 0) {
          show = true;
        }
      });
      return show;
    },
    exportExcel() {
      const header = ["保险医疗计划"];
      const rowData = [];
      this.selectionList.forEach((valueItem) => {
        if (valueItem.active) {
          const row = {
            " ": valueItem.name,
          };
          this.chosenPlan.forEach((plan) => {
            row[`${plan.name} - ${plan.productName}`] =
              this.final[plan.id][valueItem.name];
          });
          rowData.push(row);
        }
      });
      console.log("here", rowData);
      this.header = header;
      this.rowData = rowData;
      this.showModal();
    },
  },
};
</script>

<template>
  <main>
    <div class="header">保险医疗计划方案模板</div>
    <div class="plan-select-container">
      <div>计划</div>
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
      <a-button type="primary" style="margin-left: 2px" @click="getDetails"
        >获取计划信息</a-button
      >
      <a-button type="primary" class="export-button" @click="exportExcel"
        >导出列表</a-button
      >
    </div>
    <div class="title-container">
      <div class="title-item" v-for="(item, i) in chosenPlan" :key="i">
        {{ `${item.name} - ${item.productName}` }}
      </div>
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
    </div>
    <a-modal
      ref="modalRef"
      v-model:visible="visible"
      :wrap-style="{ overflow: 'hidden' }"
      :title="null"
      :footer="null"
    >
      <div class="modal-container">
        <p>确定下载Excel？</p>
        <div class="modal-button-row">
          <a-button style="margin-right: 8px" @click="visible = false"
            >取消</a-button
          >
          <json-excel
            :data="rowData"
            :header="header"
            name="保险医疗计划"
            type="xls"
          >
            <a-button type="primary">确定下载</a-button>
          </json-excel>
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
</style>
