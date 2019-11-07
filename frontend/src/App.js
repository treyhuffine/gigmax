import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import SignIn from './SignIn';
import Loading from './Loading';
// import HeatMap from './HeatMap';
import Placeholder from './Placeholder';

function App() {
  return (
    <Router>
      <Switch>
        <Route exact path="/" component={SignIn} />
        <Route exact path="/loading" component={Loading} />
        <Route exact path="/tipsman" component={Placeholder} />
      </Switch>
    </Router>
  );
}

export default App;
