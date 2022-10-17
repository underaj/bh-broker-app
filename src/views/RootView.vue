<script>
import { message } from "ant-design-vue";
import "ant-design-vue/es/message/style/css";
import axios from "axios";
export default {
  mounted() {
    const token = window.localStorage.getItem("token");
    if (token) {
      axios.defaults.headers.common.Authorization = token;
      axios({
        url: "/api/checkAuth",
      }).then((res) => {
        if (res.data.errno === 401) {
          window.localStorage.setItem("token", "");
          message.error(res.data.errmsg);
        } else {
          this.$router.push({ name: "home" });
        }
      });
    }
  },
  data() {
    return {
      user: "",
      password: "",
    };
  },
  methods: {
    login() {
      axios({
        url: "/api/loginUser",
        method: "post",
        data: { user: this.user, password: this.password },
        header: {
          "Content-Type": "application/json",
        },
      }).then((res) => {
        if (res.data.data && res.data.data.token) {
          const token = res.data.data.token;
          window.localStorage.setItem("token", token);
          axios.defaults.headers.common.Authorization = token;
          this.$router.push({ name: "home" });
        } else {
          console.log();
          message.error(res.data.errmsg);
        }
      });
    },
    wxLogin() {
      const code =
        this.$route.query.code || window.localStorage.getItem("wxcode");
      if (code) {
      } else {
        window.location.href =
          "https://open.work.weixin.qq.com/wwopen/sso/qrConnect?appid=ww3998faacdb590e99&agentid=1000023&redirect_uri=http://127.0.0.1:8010/home";
      }
    },
  },
};
</script>

<template>
  <main>
    <div class="container">
      <div class="inner-container">
        <a-input v-model:value="user" placeholder="账号"></a-input>
        <a-input-password
          v-model:value="password"
          placeholder="密码"
          style="margin: 12px 0"
        ></a-input-password>
        <div class="button-row">
          <a-button
            style="width: 100%; margin-bottom: 8px"
            type="primary"
            @click="login"
            >密码登入</a-button
          >
          <a-button style="width: 100%" @click="wxLogin">企业微信登入</a-button>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.container {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
.inner-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 300px;
}

.button-row {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 300px;
}
</style>
