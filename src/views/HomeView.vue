<script>
import axios from "axios";
import qs from "qs";
export default {
  components: {},

  data() {
    return {
      planList: [],
      plan: [],
      chosenPlan: [],
      selectionList: [],
      answerList: {},
      final: {},
    };
  },
  mounted() {
    this.getPlans();
  },
  methods: {
    getPlans() {
      axios.get("/api/plans").then((res) => {
        this.planList = res.data.data.plans;
      });
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
          this.selectionList.forEach((item) => {
            this.chosenPlan.forEach((plan) => {
              if (!final[plan.id]) {
                final[plan.id] = {};
              }
              final[plan.id][item.name] = "";
            });
            answerList[item.name] = {};
            item.values.forEach((valueItem) => {
              valueItem.planIds.forEach((id) => {
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
          console.log(answerList, final);
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
      console.log(this.final);
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
        mode="multiple"
        placeholder="请选择计划"
      >
        <a-select-option
          v-for="(option, x) in planList"
          :key="`option-${x}`"
          :value="option.id"
        >
          {{ `${option.name} - ${option.productName}` }}
        </a-select-option>
      </a-select>
      <a-button @click="getDetails">获取计划信息</a-button>
      <a-button class="export-button" @click="exportExcel">导出列表</a-button>
    </div>
    <div class="title-container">
      <div class="title-item" v-for="(item, i) in chosenPlan" :key="i">
        {{ `${item.name} - ${item.productName}` }}
      </div>
    </div>
    <div class="content-container">
      <div
        class="value-container"
        v-for="(valueItem, i) in selectionList"
        :key="i"
      >
        <div class="value-title">{{ valueItem.name }}</div>
        <div
          class="value-select-container"
          v-for="(plan, y) in chosenPlan"
          :key="y"
        >
          <div v-if="checkIfHaveValue(valueItem, plan)">
            <a-select
              :style="{ width: '180px' }"
              v-model:value="final[plan.id][valueItem.name]"
            >
              <a-select-option
                v-for="(value, x) in answerList[valueItem.name][plan.id]"
                :key="`value-${x}`"
                :value="value"
              >
                {{ value }}
              </a-select-option>
            </a-select>
          </div>
        </div>
      </div>
    </div>
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
  margin-left: 24px;
}
.title-container {
  display: flex;
  flex-direction: row;
  margin-left: 224px;
}
.title-item {
  width: 200px;
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
  text-align: center;
}
.value-select-container {
  width: 200px;
}
</style>
