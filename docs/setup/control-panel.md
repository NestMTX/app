# The Control Panel

<script setup>
import { useData } from 'vitepress'
import { computed } from 'vue'

const { isDark } = useData()
const src = computed(() => isDark.value ? '/screenshots/control-panel-dark.png' : '/screenshots/control-panel-light.png')
</script>

The NestMTX control panel provides a comprehensive overview of the system's performance, resource usage, and active processes.

<img :src="src" />

## CPU Usage

The **CPU Usage** section displays multiple bars, each representing the CPU load on different cores or logical processors. The bars are color-coded as follows:

- **Green**: Represents the remaining CPU capacity, indicating the proportion of the CPU that is idle or lightly used.
- **Red**: Represents the total of CPU used by the system (including system calls, user processes, niceness values, and interrupt requests).

## Memory Usage

The **Memory Usage** section displays a single bar showing the total amount of memory currently in use compared to the total available memory in the system. The bar is color-coded with green, indicating the used memory:

## NestMTX Processes

The **NestMTX Processes** section lists the processes currently running within the NestMTX instance. The details provided for each process include:

- **Process ID**: A unique identifier assigned to each process.
- **Process Name**: The name of the process, such as `nestmtx`, `mediamtx`, or other specific components of the NestMTX application.
- **CPU Usage**: The percentage of CPU resources that each process is consuming.
- **Memory Usage**: The amount of memory being used by each process.
- **Uptime**: The duration for which each process has been continuously running.

:::info Tip
You can start, stop and restart processes using the controls for each process.
:::

## NestMTX Paths

The **NestMTX Paths** section provides information on the active streaming paths within the NestMTX instance. Each path represents a stream that is currently active. The details include:

- **Path**: The specific path or stream.
- **Streaming**: Indicates whether the path is currently streaming.
- **Uptime**: The duration for which the path has been actively streaming.
- **Track Count**: The number of media tracks (such as audio and video) that are being streamed through this path.
- **Data Received**: The total amount of data received through the path since the stream started.
- **Data Sent**: The total amount of data sent through the path since the stream started.
