import { TbBrandTwitter, TbShare, TbDownload, TbCopy } from "react-icons/tb";
import React, { useRef, useState, useEffect } from "react";

import {
  download,
  fetchData,
  downloadJSON,
  cleanUsername,
  share,
  copyToClipboard
} from "../utils/export";

const Graphs = (props) => {
  const { member, data, loading, theme, error } = props;
  const canvasRef = useRef();
  const contentRef = useRef();

  useEffect(() => {
    if (!data) {
      return;
    }
    draw();
  }, [data, theme]);

  const onDownload = (e) => {
    e.preventDefault();
    download(canvasRef.current);
  };

  const onCopy = (e) => {
    e.preventDefault();
    copyToClipboard(canvasRef.current);
  };

  const onShare = (e) => {
    e.preventDefault();
    share(canvasRef.current);
  };

  const onDownloadJson = (e) => {
    e.preventDefault();
    if (data != null) {
      downloadJSON(data);
    }
  };

  const draw = async () => {
    if (!canvasRef.current || !data) {
      setError("Something went wrong... Check back later.");
      return;
    }

    const { drawContributions } = await import("github-contributions-canvas");

    drawContributions(canvasRef.current, {
      data,
      username: member.name,
      skipAxisLabel: false,
      themeName: theme,
      footerText: `This week contributions: ${data.thisWeekCount}, Last week contributions: ${data.lastWeekCount}`
    });
    contentRef.current.scrollIntoView({
      behavior: "smooth"
    });
  };

  const _renderDownloadAsJSON = () => {
    if (data === null) return;
    return (
      <a href="#" onClick={onDownloadJson}>
        <span role="img" aria-label="Bar Chart">
          📊
        </span>{" "}
        Download data as JSON for your own visualizations
      </a>
    );
  };

  const _renderLoading = () => {
    return (
      <div className="App-centered">
        <div className="App-loading">
          <img src={"/loading.gif"} alt="Loading..." width={200} />
          <p>Please wait, I’m visiting [{member?.name}] profile...</p>
        </div>
      </div>
    );
  };

  const _renderError = () => {
    return (
      <div className="App-error App-centered">
        <p>{error}</p>
      </div>
    );
  };

  const _renderGraphs = () => {
    return (
      <div
        className="App-result"
        style={{ display: data !== null && !loading ? "block" : "none" }}
      >
        {data !== null && (
          <>
            <a href={`https://github.com/${data.login}`} target="_blank" title={member.name}>
              <canvas ref={canvasRef} />
            </a>
            {/* <div className="App-buttons">
              <button
                className="App-download-button"
                onClick={onCopy}
                type="button"
              >
                <TbCopy size={18} />
                Copy
              </button>
              <button
                className="App-download-button"
                onClick={onDownload}
                type="button"
              >
                <TbDownload size={18} />
                Download
              </button>
              {global.navigator && "share" in navigator && (
                <button
                  className="App-download-button"
                  onClick={onShare}
                  type="button"
                >
                  <TbShare size={18} />
                  Share
                </button>
              )}
            </div> */}
          </>
        )}
      </div>
    );
  };

  return (
    <section className="App-content" ref={contentRef}>
      {loading && _renderLoading()}
      {error && _renderError()}
      {_renderGraphs()}
    </section>
  );
};

export default Graphs;
