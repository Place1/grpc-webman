import React from 'react';
import { observer } from "mobx-react";
import { computed } from "mobx";
import { app, collections } from "../storage/stores";
import { Pane, IconButton } from "evergreen-ui";
import { Sidebar } from "./sidebar";
import { Collection } from "./collection";
import { Transition } from 'react-spring/renderprops';

@observer
export class App extends React.Component {

  @computed
  get activeCollection() {
    if (app.value.activeCollection) {
      return collections.get(app.value.activeCollection);
    }
    return undefined;
  }

  render() {
    return (
      <Pane display="flex" width="100vw" overflow="hidden">
        {!app.value.menuOpen &&
          <IconButton
            icon="menu-closed"
            onClick={() => app.value.menuOpen = !app.value.menuOpen}
            position="absolute"
          />
        }
        <Transition
          items={app.value.menuOpen}
          from={{ width: 0 }}
          enter={{ width: 250 }}
          leave={{ width: 0 }}
          config={{ tension: 200, friction: 0, velocity: 600, clamp: true }}
        >
          {show => style => show &&
            <Pane width={style.width} height="100vh" elevation={3} overflow="hidden">
              <Pane width={250}>
                <Sidebar />
              </Pane>
            </Pane>
          }
        </Transition>
        <Pane padding={24} flex="1" overflow="hidden">
          {this.activeCollection &&
            <Collection id={this.activeCollection.id} />
          }
        </Pane>
      </Pane>
    )
  }
}
