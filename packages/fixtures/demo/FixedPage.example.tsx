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

/** Reference "after" state for demos — not scanned as the broken fixture. */
export function FixedPage() {
  return (
    <div>
      <img src="/chart.png" alt="Quarterly revenue chart" />

      <label htmlFor="email">Email</label>
      <input id="email" type="text" name="email" />

      <button type="button" onClick={() => console.log("save")}>
        Save
      </button>

      <a href="/docs">Read the documentation</a>

      <button type="button" aria-label="Search">
        <SearchIcon aria-hidden />
      </button>

      <Button variant="plain" aria-label="Search">
        <SearchIcon aria-hidden />
      </Button>

      <Button isLoading spinnerAriaLabel="Deploying">
        Deploy
      </Button>

      <Modal isOpen onClose={() => undefined} title="Delete resource">
        <p>Delete this resource?</p>
      </Modal>

      <AlertGroup isToast isLiveRegion>
        <Alert title="Saved" />
      </AlertGroup>

      <FormGroup label="Name" fieldId="name">
        <TextInput id="name" />
      </FormGroup>

      <TextInput id="orphan" aria-label="Orphan field" />

      <Table aria-label="Users">
        <Thead>
          <Tr>
            <Th>User</Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Td dataLabel="User">Ada</Td>
          </Tr>
        </Tbody>
      </Table>

      <Tabs aria-label="Resource sections">
        <Tab eventKey={0} title={<TabTitleText>Users</TabTitleText>} />
      </Tabs>

      <MenuToggle aria-label="Actions">
        <EllipsisVIcon aria-hidden />
      </MenuToggle>

      <Avatar src="/user.png" alt="Ada Lovelace" />

      <Switch id="details" aria-label="Show details" />

      <Checkbox id="agree" label="I agree" />

      <iframe src="/embed" title="Embedded report" />
    </div>
  );
}
