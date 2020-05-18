import { Button, Combobox, FormField, Pane, Textarea, TextInput, Alert } from 'evergreen-ui';
import { observable, computed } from 'mobx';
import { observer } from 'mobx-react';
import React, { SyntheticEvent } from 'react';
import { domain } from '../backend';
import { CollectionModel } from '../storage/models';
import { workspaces } from '../storage/stores';
import { EditableHeading } from './kit/editable-heading';

interface Props {
  id: string;
  collection: CollectionModel;
  methods: string[];
}

@observer
export class Workspace extends React.Component<Props> {

  @computed
  get workspace() {
    return workspaces.get(this.props.id)!;
  }

  @observable
  responseJSON = "";

  @observable
  error?: Error;

  invokeRPC = async () => {
    try {
      this.error = undefined;
      this.responseJSON = await domain.InvokeRPC(
        this.props.collection.protofile || "",
        this.workspace.server || "",
        this.workspace.selectedRPC || "",
        this.workspace.requestJSON || "",
      );
    } catch (error) {
      this.error = error;
    }
  }

  render() {
    return (
      <div>
        <Pane background="tint1" padding={12} marginBottom={24}>
          <Pane marginBottom={24}>
            <EditableHeading
              size={700}
              value={this.workspace.name}
              onChange={value => this.workspace!.name = value}
            />
          </Pane>

          <FormField label="Server" marginBottom={24} isRequired>
            <TextInput
              width="100%"
              placeholder="https://example.com"
              value={this.workspace.server}
              onChange={(event: SyntheticEvent<HTMLInputElement>) => this.workspace.server = event.currentTarget.value}
            />
          </FormField>

          <FormField label="gRPC Method" isRequired>
            <Pane display="flex">
              <Combobox
                width="100%"
                items={this.props.methods}
                selectedItem={this.workspace.selectedRPC || ''}
                onChange={selected => this.workspace.selectedRPC = selected}
                placeholder="Select gRPC"
              />
              <Button
                height={32}
                appearance="primary"
                marginLeft={12}
                onClick={this.invokeRPC}
              >
                Send
              </Button>
            </Pane>
          </FormField>
        </Pane>

        {this.workspace.selectedRPC &&
          <Pane display="flex" background="tint1" padding={12}>
            <Pane marginRight={12} flexBasis="50%">
              <FormField label="Request Message">
                <Textarea
                  rows={10}
                  value={this.workspace.requestJSON}
                  onChange={(event: SyntheticEvent<HTMLTextAreaElement>) => this.workspace.requestJSON = event.currentTarget.value}
                />
              </FormField>
            </Pane>
            <Pane marginLeft={12} flexBasis="50%">
              <FormField label="Response Message">
                  {this.responseJSON &&
                    <Textarea
                      rows={10}
                      value={this.responseJSON + '\n'}
                      onChange={() => undefined}
                    />
                  }
                  {this.error &&
                    <Alert
                      intent="danger"
                      title="Error"
                    >
                      <pre>{String(this.error).replace(/:\s/g, '\n→ ')}</pre>
                    </Alert>
                  }
              </FormField>
            </Pane>
          </Pane>
        }

        {/* <Button onClick={() => window.open("https://www.w3schools.com")}>
          Show Protos
        </Button> */}
      </div>
    );
  }
}
