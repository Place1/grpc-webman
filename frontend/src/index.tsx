import React from 'react';
import ReactDOM from 'react-dom';
import 'core-js/stable';

import * as Wails from '@wailsapp/runtime';

function App() {
  return (
    <div>
      <h1>hello world!</h1>
    </div>
  )
}

Wails.Init(() => {
  ReactDOM.render(<App />, document.getElementById('app'));
});
