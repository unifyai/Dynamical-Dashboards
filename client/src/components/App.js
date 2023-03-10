import React, { Component } from "react";
import NavBar from "./modules/NavBar.js";
import { Router } from "@reach/router";
import Home from "./pages/Home.js";
import NotFound from "./pages/NotFound.js";

import "../utilities.css";
import "./App.css";

/**
 * Define the "App" component as a class.
 */

class App extends Component {
  // makes props available in this component
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <>
        <NavBar />
        <div className="App-container">
          <Router>
            <Home path="/" />
            <NotFound default />
          </Router>
        </div>
      </>
    );
  }
}

export default App;
