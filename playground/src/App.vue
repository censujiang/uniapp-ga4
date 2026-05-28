<script setup lang="ts">
import { onLaunch, onHide } from "@dcloudio/uni-app";
import { ga4 } from "./ga4";

onLaunch(() => {
  ga4.init();
  console.log("App Launch");
});
onHide(() => {
  void ga4.appHide();
  console.log("App Hide");
});
</script>
<style></style>
