# The Logs Interface

<script setup>
import { useData } from 'vitepress'
import { computed } from 'vue'

const { isDark } = useData()
const src = computed(() => isDark.value ? '/screenshots/logs-dark.png' : '/screenshots/logs-light.png')
</script>

The NestMTX log interface provides you with easy access to the system logs for the various services and processes which are run by NestMTX.

<img :src="src" />

The interface has the following columns:

| Log Level                     | Service                                         | Message                | Timestamp                              |
| ----------------------------- | ----------------------------------------------- | ---------------------- | -------------------------------------- |
| The severity level of the log | The name of the service which generated the log | The message of the log | The date/time that the log was written |
