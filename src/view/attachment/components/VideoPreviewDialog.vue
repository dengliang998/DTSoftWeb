<template>
  <el-dialog v-model="dialogVisible" title="视频预览" width="60%" @close="handleClose">
    <video :src="videoUrl" controls style="width: 100%; height: auto"></video>
  </el-dialog>
</template>

<script>
export default {
  name: 'VideoPreviewDialog',
  props: {
    modelValue: { type: Boolean, default: false },
    videoUrl: { type: String, default: '' }
  },
  emits: ['update:modelValue'],
  computed: {
    dialogVisible: {
      get() {
        return this.modelValue
      },
      set(v) {
        this.$emit('update:modelValue', v)
      }
    }
  },
  methods: {
    handleClose() {
      this.$emit('update:modelValue', false)
    }
  }
}
</script>
