import * as Wails from '@wailsapp/runtime';
import 'core-js/stable';
import { Alert, Spinner, defaultTheme } from 'evergreen-ui';
import { observer } from 'mobx-react';
import { fromPromise } from 'mobx-utils';
import React from 'react';
import ReactDOM from 'react-dom';
import { Backend, setBackend } from './backend';
import { App } from './components/app';
import './index.css';
import { app, collections, workspaces } from './storage/stores';
import { Spring } from 'react-spring/renderprops';

@observer
class Root extends React.Component {

  ready = fromPromise(Promise.all([
    app.load(),
    collections.load(),
    workspaces.load(),
  ]));

  render() {
    return this.ready.case({
      pending: (staleValue) => {
        return <div></div>;
      },
      rejected: (error) => {
        return <Alert intent="danger" title="Big oops">{String(error)}</Alert>;
      },
      fulfilled: (value) => {
        return (
          <Spring from={{ opacity: 0 }} to={{ opacity: 1 }} config={{ tension: 280, friction: 26 }}>
            {props => (
              <div style={props}>
                <App />
              </div>
            )}
          </Spring>
        );
      },
    });
  }
}

declare global {
  const backend: Backend;
}

Wails.Init(() => {
  setBackend(backend);
  ReactDOM.render(<Root />, document.getElementById('app'));
});
