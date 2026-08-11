import React from "react";
import {
  AlertGroup,
  Alert,
  Avatar,
  Button,
  Checkbox,
  FormGroup,
  Modal,
  Switch,
  Tabs,
  Tab,
  TabTitleText,
  TextInput,
  MenuToggle,
} from "@patternfly/react-core";
import { Table, Thead, Tr, Th, Tbody, Td } from "@patternfly/react-table";
import { SearchIcon, EllipsisVIcon } from "@patternfly/react-icons";

/** Intentionally inaccessible demo page for CapyA11y Innovation Days. */
export function BrokenPage() {
  return (
    <div>
      <img src="/chart.png" />

      <input type="text" name="email" />

      <div onClick={() => console.log("save")}>Save</div>

      <a href="/docs">click here</a>

      <button type="button">
        <SearchIcon />
      </button>

      <Button variant="plain">
        <SearchIcon />
      </Button>

      <Button isLoading>Deploy</Button>

      <Modal isOpen onClose={() => undefined}>
        <p>Delete this resource?</p>
      </Modal>

      <AlertGroup isToast>
        <Alert title="Saved" />
      </AlertGroup>

      <FormGroup label="Name">
        <TextInput id="name" />
      </FormGroup>

      <TextInput id="orphan" />

      <Table>
        <Thead>
          <Tr>
            <Th>User</Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Td>Ada</Td>
          </Tr>
        </Tbody>
      </Table>

      <Tabs>
        <Tab eventKey={0} title={<TabTitleText>Users</TabTitleText>} />
      </Tabs>

      <MenuToggle>
        <EllipsisVIcon />
      </MenuToggle>

      <Avatar src="/user.png" />

      <Switch id="details" />

      <Checkbox />

      <iframe src="/embed" />
    </div>
  );
}
