use clap::Parser;
use gst::prelude::*;
use gstreamer as gst;
use rust_socketio::{ClientBuilder, Payload};
use serde_json::json;
use std::error::Error;

#[derive(Parser, Debug)]
#[command(
    name = "Media Streamer",
    about = "Streams camera or static feeds to MediaMTX"
)]
struct Args {
    /// MediaMTX RTSP port
    #[arg(long)]
    mediamtx_rtsp_port: u16,

    /// MediaMTX path where the stream will be published
    #[arg(long)]
    mediamtx_path: String,

    /// Private API port for the Node.js Socket.IO server
    #[arg(long)]
    private_api_port: u16,

    /// No Such Camera port for MJPEG static feed
    #[arg(long)]
    no_such_camera_port: u16,

    /// Camera Disabled port for MJPEG static feed
    #[arg(long)]
    camera_disabled_port: u16,

    /// Connecting port for MJPEG static feed
    #[arg(long)]
    connecting_port: u16,
}

// Start the GStreamer pipeline for the "connecting" feed
fn start_pipeline(
    _mediamtx_rtsp_port: u16,
    _mediamtx_path: &str,
    _no_such_camera_port: u16,
    _camera_disabled_port: u16,
    connecting_port: u16,
) -> Result<(), Box<dyn Error>> {
    // Initialize GStreamer
    gst::init()?;

    // GStreamer pipeline that reads from the "connecting" port and decodes the MJPEG stream
    let pipeline_str = format!(
        "tcpclientsrc port={} ! multipartdemux ! jpegdec ! autovideosink",
        connecting_port
    );

    // Create and launch the GStreamer pipeline
    let pipeline = gst::parse_launch(&pipeline_str)?;
    let pipeline = pipeline.dynamic_cast::<gst::Pipeline>().unwrap();

    // Start the pipeline
    pipeline.set_state(gst::State::Playing)?;

    // Wait until EOS (End of Stream) or error occurs
    let bus = pipeline.bus().unwrap();
    for msg in bus.iter_timed(gst::ClockTime::NONE) {
        match msg.view() {
            gst::MessageView::Eos(..) => break,
            gst::MessageView::Error(err) => {
                eprintln!(
                    "Error from {}: {} ({:?})",
                    err.src()
                        .map(|s| s.path_string().into::<gst::glib::GString>())
                        .unwrap_or_else(|| "unknown".into()),
                    err.error(),
                    err.debug()
                );
                break;
            }
            _ => (),
        }
    }

    // Set the pipeline to null (stopping it)
    pipeline.set_state(gst::State::Null)?;

    Ok(())
}

fn connect_to_private_api(port: u16) -> Result<(), Box<dyn std::error::Error>> {
    let url = format!("http://127.0.0.1:{}", port);

    let callback = |payload: Payload, _| match payload {
        Payload::Text(str) => println!("Received: {}", str),
        Payload::Binary(bin_data) => println!("Received bytes: {:#?}", bin_data),
        Payload::String(str) => println!("Received (deprecated): {}", str),
    };

    // Connect to the Node.js Socket.IO server and listen to "test" events
    let socket = ClientBuilder::new(&url)
        .on("test", callback)
        .on("error", |err, _| eprintln!("Error: {:#?}", err))
        .connect()
        .expect("Connection failed");

    // Emit a message to the "foo" event
    let json_payload = json!({"token": 123});
    socket
        .emit("foo", json_payload)
        .expect("Server unreachable");

    Ok(())
}

fn main() -> Result<(), Box<dyn Error>> {
    // Parse the arguments
    let args = Args::parse();

    // Start the GStreamer pipeline for the "connecting" feed
    start_pipeline(
        args.mediamtx_rtsp_port,
        &args.mediamtx_path,
        args.no_such_camera_port,
        args.camera_disabled_port,
        args.connecting_port,
    )?;

    // Connect to the private Node.js API using rust_socketio
    connect_to_private_api(args.private_api_port)?;

    Ok(())
}
