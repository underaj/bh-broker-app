<script>
export default {
  mounted() {
    const code =
      this.$route.query.code || window.localStorage.getItem("wxcode");
    if (code) {
      
    } else {
      window.location.href =
        "https://open.work.weixin.qq.com/wwopen/sso/qrConnect?appid=ww3998faacdb590e99&agentid=1000023&redirect_uri=http://127.0.0.1:8010/home";
    }
  },
  methods: {},
};
</script>

<template>
  <main>
    <div></div>
  </main>
</template>

<style scoped></style>
