import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import SignIn from './SignIn';
//import HeatMap from './HeatMap';
        //<Route path="/tipsmap" component={HeatMap} />


function App() {
  return (
    <Router>
      <Switch>
        <Route exact path="/" component={SignIn} />
      </Switch>
    </Router>
  );
}

export default App;
