import React from 'react';
import { Button, FolderCloseIcon, FolderOpenIcon, Heading, IconButton, Pane, Paragraph } from 'evergreen-ui';
import { observer } from 'mobx-react';
import { CollectionModel } from '../storage/models';
import { app, collections, workspaces } from '../storage/stores';
import { Text } from './kit/text';

@observer
export class Sidebar extends React.Component {

  addCollection = () => {
    const c = collections.create({
      name: 'Untitled',
      files: [],
    });

    workspaces.create({
      name: 'Untitled',
      collectionId: c.id,
    });

    app.value.activeCollection = c.id;
  }

  removeCollection = (collection: CollectionModel) => {
    collections.delete(collection.id);
  }

  render() {
    return (
      <Pane>
        <div>
          <Pane display="flex" alignItems="center">
            <Heading padding={24} size={800}>Collections</Heading>
            <IconButton icon="menu-open" onClick={() => app.value.menuOpen = !app.value.menuOpen} />
          </Pane>
          {collections.all().map(collection => (
            <Pane
              key={collection.id}
              className="hover-tint"
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              padding={24}
              onClick={() => app.value.activeCollection = collection.id}
              cursor="pointer"
            >
              <Pane display="flex" minWidth={0}>
                {app.value.activeCollection === collection.id ? (
                  <FolderOpenIcon flexShrink={0} color="selected" />
                ) : (
                  <FolderCloseIcon flexShrink={0} color="muted" />
                )}
                <Paragraph marginLeft={12} minWidth={0}>
                  <Text>{collection.name}</Text>
                </Paragraph>
              </Pane>
              <IconButton
                appearance="minimal"
                icon="cross"
                flexShrink={0}
                onClick={(event: MouseEvent) => {
                  event.stopPropagation();
                  this.removeCollection(collection)
                }}
              />
            </Pane>
          ))}
        </div>
        <Pane padding={24}>
          <Button
            onClick={this.addCollection}
            height={48}
            width="100%"
            display="flex"
            justifyContent="center"
          >
            Add Collection
          </Button>
        </Pane>
      </Pane>
    );
  }
}
