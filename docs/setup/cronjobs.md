# Cronjobs Management

<script setup>
import { useData } from 'vitepress'
import { computed } from 'vue'

const { isDark } = useData()
const src = computed(() => isDark.value ? '/screenshots/cronjobs-dark.png' : '/screenshots/cronjobs-light.png')
</script>

The **Cronjobs** page in NestMTX allows you to view and manually manage system cronjobs that automate various tasks within the application. This interface is designed to give you control over scheduled tasks, allowing you to monitor their status, execution times, and manually trigger them if needed.

<img :src="src" />

The **Cronjobs List** section displays all the scheduled cronjobs currently configured in your NestMTX instance. For each cronjob, the following details are provided:

- **Name**: The name of the cronjob, which typically describes the task it performs.
- **Crontab**: The cron schedule expression that defines when the job is set to run. The expression follows the enhanced cron format of the [Milicron](https://github.com/jakguru/milicron) library.
- **Last Run At**: Displays the timestamp of the last time the cronjob was executed.
- **Last End At**: Indicates the time when the cronjob last completed its execution.

## Manual Execution

Each cronjob in the list has a play button (`▶`) next to its name. Clicking this button manually triggers the cronjob to run immediately, regardless of its scheduled time. This feature is particularly useful for testing cronjobs or running critical tasks on demand.
