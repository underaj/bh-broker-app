<script>
import axios from "axios";
export default {
  mounted() {
    const token = window.localStorage.getItem("token");
    if (token) {
      axios.defaults.headers.common.Authorization = token;
      this.$router.push({ name: "home" });
    }
    // const code =
    //   this.$route.query.code || window.localStorage.getItem("wxcode");
    // if (code) {
    // } else {
    //   window.location.href =
    //     "https://open.work.weixin.qq.com/wwopen/sso/qrConnect?appid=ww3998faacdb590e99&agentid=1000023&redirect_uri=http://127.0.0.1:8010/home";
    // }
  },
  methods: {
    login() {
      axios({
        url: "/api/loginUser",
        method: "post",
        data: { user: "broker", password: "123456" },
        header: {
          "Content-Type": "application/json",
        },
      }).then((res) => {
        if (res.data.data.token) {
          const token = res.data.data.token;
          window.localStorage.setItem("token", token);
          axios.defaults.headers.common.Authorization = token;
          this.$router.push({ name: "home" });
        } else {
          console.log(res.data.errmsg);
        }
      });
    },
  },
};
</script>

<template>
  <main>
    <div><button @click="login">登入</button></div>
  </main>
</template>

<style scoped></style>
