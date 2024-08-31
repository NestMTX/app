# Building and Deploying NestMTX from Source

While using Docker is the recommended and easiest way to deploy NestMTX, advanced users may prefer to build and deploy the application from source. This process requires a solid understanding of command-line tools and software dependencies. If you're comfortable with the command line and want to dive into the source code, this guide will help you get started.

:::warning Important
This process is recommended only for users who are familiar with building software from source and are comfortable working with the command line.
:::

## Prerequisites

Before building NestMTX from source, ensure that the following software is installed and properly configured on your system:

### 1. Node.js

NestMTX requires **Node.js v21.x** to run. You can install Node.js via your package manager or download it directly from the [Node.js website](https://nodejs.org/).

To check your Node.js version, run:

```bash
node -v
```

Make sure it returns a version that starts with `21`.

:::info Tip
NestMTX uses the `yarn` package manager. We recommend using the same. To install yarn, you can run:

```bash
npm -i yarn -g
```

:::

### 2. GStreamer

GStreamer is critical for managing media streams, especially for WebRTC connections. You'll need GStreamer with support for the following elements:

- `udpsrc`
- `rtpjitterbuffer`
- `rtph264depay`
- `h264parse`
- `opusdec`
- `audioconvert`
- `avenc_aac`
- `rtspclientsink`

#### GStreamer Installation

On Debian/Ubuntu-based systems, you can install GStreamer and the required plugins with:

```bash
sudo apt-get install gstreamer1.0-tools gstreamer1.0-plugins-base gstreamer1.0-plugins-good gstreamer1.0-plugins-bad
```

For other distributions, refer to your package manager's documentation.

### 3. FFmpeg

FFmpeg is used for handling and transcoding media streams, particularly for RTSP connections. Ensure FFmpeg is installed with support for the following codecs and features:

- `libx264` for H.264 video encoding
- `aac` for AAC audio encoding
- Support for `rtsp`, `tcp`, `udp`, and low-latency streaming

#### FFMpeg Installation

On Debian/Ubuntu-based systems, you can install FFmpeg with:

```bash
sudo apt-get install ffmpeg
```

To verify that FFmpeg is installed correctly and has the necessary codecs, run:

```bash
ffmpeg -codecs | grep -E 'libx264|aac'
```

Ensure that `libx264` and `aac` are listed as supported.

## Downloading the source code

Once all dependencies are installed, you can clone the NestMTX repository from GitHub:

```bash
git clone https://github.com/yourusername/nestmtx.git
cd nestmtx
```

:::info Note
If you would like to use a specific stable version, you can check out the release tag:

```bash
git checkout git checkout tags/<version> -b main
```

:::

## Building the Application

After installing the necessary dependencies, follow these steps to build and configure NestMTX from the source.

### Step 1: Install Dependencies

You need to install the dependencies both in the root of the project and within the `gui/` folder.

- Install dependencies in the root of the project:

  ```bash
  yarn install
  ```

- Navigate to the `gui/` folder and install its dependencies:

  ```bash
  cd gui
  yarn install
  cd ..
  ```

### Step 2: Install and Configure MediaMTX

NestMTX requires MediaMTX to manage media streams. You can download, install, and configure the correct version of MediaMTX using the following command:

```bash
node ace mediamtx:install
```

This command downloads the relevant version of MediaMTX and sets up the codebase to work with it correctly.

### Step 3: Generate and Install the GUI

NestMTX includes a web-based GUI that needs to be generated and installed in the correct directory for hosting. Run the following command to generate the GUI:

```bash
yarn gui:generate
```

This command will compile the GUI and place it in the appropriate folder within the project, making it ready for use when the application is started.

### Step 4: Build the Application

After configuring MediaMTX and generating the GUI, the next step is to build the NestMTX application itself. Run the following command:

```bash
node ace build
```

This command will compile the application code and create a `build` directory where the compiled code will be stored.

### Step 5: Copy Required Directories

After building the application, you need to copy the `resources` and `logger-transports` directories into the newly created `build` directory. These directories contain essential resources and logging configurations required for the application to run correctly.

```bash
cp -r resources build/
cp -r logger-transports build/
```

### Step 6: Create the `.env` File

Next, you need to create a `.env` file in the root of the `build` directory. This file can be copied from the `.env.example` file located at the root of the project:

```bash
cp .env.example build/.env
```

This `.env` file will contain the environment variables necessary for configuring NestMTX. You can customize these variables as needed. For more inforamtion about the available options, please see the [Configuration Options Documentation](/installation/configuration).

## Starting the NestMTX Server

To start the NestMTX server in a production environment, you can run the server directly or, for better management and reliability, use a process manager like PM2.

### Running the Server Directly

You can start the server by running the following command:

```bash
node /path/to/nestmtx/build/bin/server.js
```

This will launch the server in the foreground, and it will continue running as long as the terminal session remains open.

### Using PM2 for Process Management

For production environments, it is recommended to use a process manager like PM2. PM2 offers several advantages:

- **Background Execution**: PM2 runs your application in the background, freeing up your terminal session.
- **Automatic Restarts**: PM2 automatically restarts the application if it crashes, ensuring higher availability.
- **Single Instance Management**: Since NestMTX is not horizontally scalable, PM2 will be configured to run only a single instance of the server.

### Setting Up PM2 with an Ecosystem File

Below is an example of a PM2 ecosystem configuration file (`ecosystem.config.js`) that you can use:

```javascript
module.exports = {
  apps: [
    {
      name: 'nestmtx',
      script: '/path/to/nestmtx/build/bin/server.js',
      instances: 1, // Ensures only one instance is running
      exec_mode: 'fork', // Runs in fork mode to avoid clustering
      autorestart: true,
    },
  ],
}
```

### Starting the Server with PM2

To start the server using PM2, follow these steps:

1. Create the `ecosystem.config.js` file in your project directory with the content provided above.
2. Start the server using PM2 with the following command:

   ```bash
   pm2 start ecosystem.config.js
   ```

PM2 will manage the server process, ensuring that only one instance runs at a time and that it automatically restarts if it crashes.
