import logo from "./logo.svg";
import "./App.css";
import { ProgressBar, Button } from "react-bootstrap";
import { useEffect, useState } from "react";
import axios from "axios";
import { Client } from "@stomp/stompjs";
import { v4 as uuidv4 } from "uuid";

const App = () => {
  const [progress, setProgress] = useState(0);
  const [subscription, setSubscription] = useState();
  const [token, setToken] = useState(uuidv4()); // using uuidv4 to simulate a JWT authorization token

  const client = new Client();

  const onConnected = () => {
    setSubscription(
      client.subscribe("/user/queue/progressbar", (message) => {
        if (message?.body) {
          const response = JSON.parse(message.body);
          if (response?.progress) {
            setProgress(response.progress);
          }
        }
      })
    );
  };

  const onDisconnected = () => {
    if (subscription) {
      subscription.unsubscribe();
    }
  };

  // a token is needed for JWT Authorization
  client.configure({
    brokerURL: `ws://localhost:8080/app-websocket?token=Bearer ${token}`,
    debug: (str) => {
      console.log(str);
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
    onConnect: onConnected,
    onDisconnect: onDisconnected,
  });

  const handleClickViaPostMapping = () => {
    setProgress(0);
    client.activate();
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    axios
      .post("http://localhost:8080/progressbar/send", {
        message: "Message via PostMapping",
      })
      .then(function (response) {
        console.log(response);
      })
      .catch(function (error) {
        console.log(error);
      });
  };

  const handleClickViaMessageMapping = () => {
    setProgress(0);
    client.activate();
    // there is a delay between activate and publish
    setTimeout(() => {
      client.publish({
        destination: "/app/send",
        body: JSON.stringify({
          message: "Message via MessageMapping",
        }),
        headers: { Authorization: `Bearer ${token}` },
      });
    }, 1000);
  };

  useEffect(() => {
    return function cleanup() {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [subscription]);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <div>React progress bar with Spring websocket</div>
      </header>
      <main className="App-main">
        <div>react-bootstrap</div>
        <div className="w-50 m-3">
          <ProgressBar
            variant="info"
            animated
            now={progress}
            label={`${progress}%`}
          />
        </div>
        <div>vanilla bootstrap</div>
        <div className="progress w-50 m-3">
          <div
            className="progress-bar progress-bar-striped progress-bar-animated"
            role="progressbar"
            style={{ width: `${progress}%` }}
            aria-valuenow={progress}
            aria-valuemin="0"
            aria-valuemax="100"
          >
            {progress}%
          </div>
        </div>
        <div>
          <Button
            className="m-3"
            variant="success"
            onClick={handleClickViaMessageMapping}
          >
            Start via MessageMapping
          </Button>
          <Button
            className="m-3"
            variant="success"
            onClick={handleClickViaPostMapping}
          >
            Start via PostMapping
          </Button>
        </div>
      </main>
    </div>
  );
};

export default App;
