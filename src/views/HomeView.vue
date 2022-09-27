<script>
import ContentView from "../components/content.vue";
const products = [
  { name: "高端医疗产品", id: 0, checked: false },
  { name: "含孕产", id: 1, checked: false },
  { name: "高端医疗出单规则", id: 2, checked: false },
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
      } else {
        newChosen.push(item);
      }

      this.chosenProduct = newChosen;
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
      </div>
      <a-tabs v-model:activeKey="activeKey">
        <a-tab-pane
          v-for="pane in chosenProduct"
          :key="pane.id"
          :tab="pane.name"
        >
          <ContentView />
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
  width: 20vw;
  max-width: 240px;
  height: 100vh;
  border-right: 1px solid #f0f0f0;
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
</style>
