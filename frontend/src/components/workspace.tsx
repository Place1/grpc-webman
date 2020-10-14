import React, { SyntheticEvent } from 'react';
import { Button, Combobox, FormField, Pane, Textarea, TextInput, Dialog, Heading } from 'evergreen-ui';
import { observable, computed } from 'mobx';
import { observer } from 'mobx-react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { domain } from '../backend';
import { CollectionModel } from '../storage/models';
import { workspaces } from '../storage/stores';
import { EditableHeading } from './kit/editable-heading';
import { ErrorCallout } from './kit/error-callout';
import { present } from './kit/present';
import { KeyvalInput } from './kit/keyval-input';
import { Loading } from './kit/loading';

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

  @observable
  sending = new Loading();

  invokeRPC = async () => {
    await this.sending.while(async () => {
      try {
        this.error = undefined;
        this.responseJSON = await domain.InvokeRPC(
          this.props.collection.files,
          this.workspace.server || "",
          this.workspace.selectedRPC || "",
          this.workspace.requestJSON || "",
          this.workspace.metadataJSON || {},
        );
      } catch (error) {
        this.error = error;
      }
    });
  }

  selectRPC = async (selected: string) => {
    this.workspace.selectedRPC = selected;
    await this.setDefaultMessage();
  }

  setDefaultMessage = async () => {
    if (this.workspace.selectedRPC) {
      this.workspace.requestJSON = await domain.GetExampleJSON(
        this.props.collection.files,
        this.workspace.selectedRPC,
      );
    }
  }

  showProto = async () => {
    const content = await domain.GetFileWithMethod(
      this.props.collection.files,
      this.workspace.selectedRPC!,
    );
    present(close => (
      <Dialog
        width="100%"
        isShown={true}
        preventBodyScrolling
        onCloseComplete={() => close()}
        header={<Heading>{content.name}</Heading>}
        footer={<Button onClick={close} appearance="primary">Close</Button>}
      >
        <SyntaxHighlighter language="protobuf" customStyle={{background: 'white'}}>
          {content.content}
        </SyntaxHighlighter>
      </Dialog>
    ));
  }

  render() {
    return (
      <div>
        <Pane background="tint1" padding={12} marginBottom={12}>
          <Pane marginBottom={12}>
            <EditableHeading
              size={700}
              value={this.workspace.name}
              onChange={value => this.workspace!.name = value}
            />
          </Pane>

          <Pane display="flex">
            <FormField label="Server" marginBottom={12} isRequired flexBasis="50%">
              <TextInput
                width="100%"
                placeholder="https://example.com"
                value={this.workspace.server || ''}
                onChange={(event: SyntheticEvent<HTMLInputElement>) => this.workspace.server = event.currentTarget.value}
              />
            </FormField>

            <FormField label="gRPC Method" isRequired flexBasis="50%" marginLeft={12}>
              <Pane display="flex">
                <Combobox
                  width="480px"
                  items={this.props.methods}
                  selectedItem={this.workspace.selectedRPC || ''}
                  onChange={selected => this.selectRPC(selected)}
                  placeholder="Select gRPC"
                />
                <Button
                  height={32}
                  appearance="default"
                  marginLeft={12}
                  onClick={this.showProto}
                >
                  Proto
                </Button>
                <Button
                  height={32}
                  appearance="primary"
                  marginLeft={12}
                  onClick={this.invokeRPC}
                  iconAfter="direction-right"
                  isLoading={this.sending.active}
                >
                  Send
                </Button>
              </Pane>
            </FormField>
          </Pane>

          <FormField label="Metadata" flexBasis="50%">
            <KeyvalInput value={this.workspace.metadataJSON} onChange={m => this.workspace.metadataJSON = m} />
          </FormField>
        </Pane>

        {this.workspace.selectedRPC &&
          <Pane display="flex" flexDirection="column" background="tint1" padding={12} marginBottom={12}>
            <FormField label="Request Message" flex={1} marginBottom={12}>
              <Button appearance="primary" height={28} onClick={this.setDefaultMessage}>
                Set Default Value
              </Button>
              <Textarea
                rows={10}
                value={this.workspace.requestJSON}
                onChange={(event: SyntheticEvent<HTMLTextAreaElement>) => this.workspace.requestJSON = event.currentTarget.value}
              />
            </FormField>
          </Pane>
        }

        {this.workspace.selectedRPC &&
          <Pane display="flex" background="tint1" padding={12} marginBottom={12}>
            <FormField label="Response Message" flex={1}>
                {this.responseJSON &&
                  <SyntaxHighlighter language="json" customStyle={{background: 'transparent'}}>
                    {this.responseJSON + '\n'}
                  </SyntaxHighlighter>
                }
                {this.error &&
                  <ErrorCallout error={this.error} />
                }
            </FormField>
          </Pane>
        }
      </div>
    );
  }
}
