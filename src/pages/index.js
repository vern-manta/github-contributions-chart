import { TbBrandTwitter, TbShare, TbDownload, TbCopy } from "react-icons/tb";
import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  download,
  fetchData,
  downloadJSON,
  cleanUsername,
  share,
  copyToClipboard
} from "../utils/export";
import ThemeSelector from "../components/themes";
import SOONMembers from "./soon-member";
import Graphs from "./graphs";
import Queue from "queue-promise";
import MantaMembers from "./manta-member";
import TestMembers from "./test-member";

const MEMBERS_MAP = {
  SOON: SOONMembers,
  Manta: MantaMembers,
  Test: TestMembers
};

const App = () => {
  const inputRef = useRef();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [theme, setTheme] = useState("standard");
  const [results, setResults] = useState([]);
  const queue = new Queue({
    concurrent: 1,
    interval: 1000,
    start: false
  });
  queue.on("reject", (error) => console.error(error));
  queue.on("resolve", (data) => {
    setResults((prevResults) => [...prevResults, data]);
  });
  const [selectedOption, setSelectedOption] = useState("SOON"); // 默认值为 "SOON"

  const handleChange = (event) => {
    setSelectedOption(event.target.value); // 更新选中的值
  };

  // const handleSubmit = (e) => {
  //   e.preventDefault();

  //   setUsername(cleanUsername(username));
  //   setLoading(true);
  //   // setError(null);
  //   // setData(null);

  //   fetchData(cleanUsername(username))
  //     .then((data) => {
  //       setLoading(false);

  //       if (data.years.length === 0) {
  //         setError("Could not find your profile");
  //       } else {
  //         setData(data);
  //       }
  //     })
  //     .catch((err) => {
  //       console.log(err);
  //       setLoading(false);
  //       setError("I could not check your profile successfully...");
  //     });
  // };

  const handleSubmitTeam = async (e) => {
    e.preventDefault();

    setUsername(cleanUsername(username));
    MEMBERS_MAP[selectedOption].forEach((member) => {
      queue.enqueue(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            console.log(Date.now(), member.login);

            fetchData(cleanUsername(member.login))
              .then((data) => {
                if (data.years.length === 0) {
                  // setError("Could not find your profile");
                } else {
                  // setData(data);
                  resolve({ member, data });
                }
              })
              .catch((err) => {
                console.log(err);

                resolve({ member, data: null, error: err });
                // setLoading(false);
                // setError("I could not check your profile successfully...");
              });
          }, 1000);
        });
      });
    });

    queue.start();
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="App-logo">
          <img src="/topguntocat.png" width={200} alt="Topguntocat" />
          <h1>GitHub Contributions Chart Generator</h1>
          <h4>All your contributions in one image!</h4>
        </div>
        {/* {_renderForm()} */}
        <div style={{ margin: "1em 0 1em" }}>
          <div>
            <h3>Choose an option:</h3>
            <label className="radio-label">
              <input
                type="radio"
                value="SOON"
                checked={selectedOption === "SOON"}
                onChange={handleChange}
              />
              SOON
            </label>
            <label className="radio-label">
              <input
                type="radio"
                value="Manta"
                checked={selectedOption === "Manta"}
                onChange={handleChange}
              />
              Manta
            </label>
            <label className="radio-label">
              <input
                type="radio"
                value="Test"
                checked={selectedOption === "Test"}
                onChange={handleChange}
              />
              Test
            </label>
          </div>
          <button onClick={handleSubmitTeam}>
            <span role="img" aria-label="Stars">
              ✨
            </span>{" "}
            {loading ? "Generating..." : `Generate ${selectedOption} Team!`}
          </button>
        </div>
        <ThemeSelector
          currentTheme={theme}
          onChangeTheme={(themeName) => setTheme(themeName)}
        />
      </header>
      <div>
        <p style={{ paddingLeft: "2rem" }}>
          Progressing: {results.length}/{MEMBERS_MAP[selectedOption].length}
        </p>
        <div className="graph-list">
          {results.map((result) => {
            return (
              <Graphs
                key={result.member.login}
                member={result.member}
                data={result.data}
                theme={theme}
                error={result.error}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default App;
