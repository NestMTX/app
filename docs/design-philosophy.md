# Design Philosophy

NestMTX is built with a focus on efficiency and resource consciousness. The underlying philosophy of the application is to ensure that resources—both on the host server and on connected devices—are only utilized when absolutely necessary.

## On-Demand Streaming

At the core of this philosophy is on-demand streaming. Instead of continuously running streams that consume bandwidth and processing power, NestMTX initiates streaming sessions only when explicitly requested by a client/consumer/reader. This approach reduces unnecessary energy consumption, minimizes the load on the host machine, and optimizes internet bandwidth utilization.

## Internet Utilization Optimization

NestMTX is designed to optimize internet usage, particularly important for users with bandwidth constraints or multiple devices. By streaming only when required, the application reduces the amount of data transmitted over the network, ensuring that your internet connection is used efficiently without compromising the quality or reliability of the streams.

## Energy Efficiency

By only engaging devices when needed, NestMTX contributes to a more energy-efficient operation of your smarthome ecosystem. Google and Nest cameras are not activated until a stream is requested, saving energy and extending the battery lifespan of these devices.

## Resource Optimization

NestMTX is designed to minimize the use of computational resources on the host. Streams are dynamically managed, starting and stopping in real-time based on demand. This ensures that CPU and memory are used efficiently, allowing the host system to maintain optimal performance even when handling multiple cameras and streaming protocols.

## Focused Scalability

While NestMTX is not horizontally scalable, it is built to handle multiple devices and streams on a single host efficiently. The application's resource-conscious design ensures that it remains sustainable and responsive, optimizing both host and network resources for reliable performance.
