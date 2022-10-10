<script>
import * as XLSX from "xlsx-js-style";
import ContentView from "../components/content.vue";
const products = [
  { name: "高端医疗产品", id: 0, checked: false },
  { name: "含孕产", id: 1, checked: false },
  { name: "高端医疗出单规则", id: 2, checked: false },
  { name: "增额寿基础规则", id: 3, checked: false },
];

export default {
  components: {
    ContentView,
  },
  data() {
    return {
      productList: products,
      chosenProductKeys: [],
      chosenProduct: [],
      activeKey: 0,
    };
  },
  methods: {
    selectProduct(item) {
      const newChosen = this.chosenProduct.slice();
      let existingLocation = -1;
      newChosen.forEach((chosen, i) => {
        if (chosen.id === item.id) {
          existingLocation = i;
        }
      });

      if (existingLocation > -1) {
        newChosen.splice(existingLocation, 1);
        if (newChosen.length > 0) {
          this.activeKey = newChosen[0].id;
        }
      } else {
        newChosen.push(item);
        this.activeKey = item.id;
      }

      this.chosenProduct = newChosen;
    },
    exportExcel() {
      const myWorkBook = XLSX.utils.book_new();
      const sheets = this.$refs.sheets;
      sheets.forEach((obj) => {
        if (obj.chosenPlan.length > 0) {
          const rowDataList = [];
          const merges = {};
          const mergesData = [];

          mergesData.push({
            s: { r: 0, c: 0 },
            e: { r: 0, c: obj.chosenPlan.length },
          });
          rowDataList.push([
            " ",
            ...obj.chosenPlan.map((plan) => {
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
          const dataProcess = (selectionList, parentName) => {
            if (parentName) {
              rowDataList.push([
                {
                  v: parentName,
                  t: "s",
                  s: {
                    alignment: { horizontal: "center" },
                    font: {
                      bold: true,
                      sz: 12,
                      wrapText: true,
                      name: "Cambria",
                    },
                  },
                },
              ]);
              mergesData.push({
                s: { r: rowDataList.length, c: 0 },
                e: { r: rowDataList.length, c: obj.chosenPlan.length },
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
                    font: {
                      bold: true,
                      sz: 12,
                      wrapText: true,
                      name: "Cambria",
                    },
                  },
                },
              ];
              obj.chosenPlan.forEach((plan, col) => {
                let currentValue = obj.final[plan.id][valueItem.name];
                let currentMergeId = null;
                let nextMergeId = null;
                let previousMergeId = null;
                if (valueItem.mergeIds && valueItem.mergeIds[plan.id]) {
                  currentMergeId = valueItem.mergeIds[plan.id];
                  currentValue =
                    obj.mergeFinal[plan.id][valueItem.mergeIds[plan.id]];
                }
                if (
                  filteredSelectionList[row + 1] &&
                  filteredSelectionList[row + 1].mergeIds &&
                  filteredSelectionList[row + 1].mergeIds[plan.id]
                ) {
                  nextMergeId =
                    filteredSelectionList[row + 1].mergeIds[plan.id];
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
                rowData.push({
                  v: currentValue,
                  t: "s",
                  s: { alignment: { vertical: "center", wrapText: true } },
                });
              });
              rowDataList.push(rowData);
            });
          };
          dataProcess(obj.selectionList);
          obj.listWithParentId.forEach((item) => {
            dataProcess(item.selectionList, item.name);
          });
          const ws = XLSX.utils.json_to_sheet([]);
          XLSX.utils.sheet_add_aoa(
            ws,
            [
              [
                {
                  v: obj.productName,
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
            ...obj.chosenPlan.map(() => {
              return { wch: 30 };
            }),
          ];

          XLSX.utils.book_append_sheet(myWorkBook, ws, obj.productName);
        }
      });
      XLSX.writeFile(myWorkBook, "保险医疗计划.xlsx");
      this.visible = false;
    },
  },
};
</script>

<template>
  <main>
    <div class="container">
      <div class="side-bar">
        <div class="header">保险医疗计划方案模板</div>
        <a-menu v-model:selectedKeys="chosenProductKeys" :multiple="true">
          <a-menu-item
            v-for="(item, x) in productList"
            :key="x"
            @click="() => selectProduct(item)"
            >{{ item.name }}</a-menu-item
          >
        </a-menu>
        <div class="button-container">
          <a-button
            type="primary"
            class="button"
            @click="() => exportExcel('EXPORT')"
          >
            导出所有列表
          </a-button>
        </div>
      </div>
      <a-tabs v-model:activeKey="activeKey">
        <a-tab-pane
          v-for="pane in chosenProduct"
          :key="pane.id"
          :tab="pane.name"
        >
          <ContentView
            ref="sheets"
            :productName="pane.name"
            :typeId="pane.id"
          />
        </a-tab-pane>
      </a-tabs>
    </div>
  </main>
</template>

<style scoped>
.container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;
}
.side-bar {
  width: 240px;
  max-width: 240px;
  height: 100vh;
  border-right: 1px solid #f0f0f0;
}
.button-container {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.button {
  width: 90%;
  margin: 12px 0;
  align-self: center;
}
.ant-menu {
  border-right: none !important;
}
.header {
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  font-size: 18px;
  font-weight: 500;
  margin: 12px;
}
.ant-tabs-nav {
  margin-bottom: 0 !important;
}
</style>
