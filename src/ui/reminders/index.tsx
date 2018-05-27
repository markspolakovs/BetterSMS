import React from "react";
import ReactDOM from "react-dom";
import { toPairs } from "lodash";

import * as dateFns from "date-fns";
import * as C from "../../util/constants";
import { Reminder, ReminderList } from "../../features/reminders";
import $ from "jquery";
import "jqueryui";

interface State {
  reminders?: ReminderList;
}

class Reminders extends React.Component<{}, State> {
  state: State = {};

  private listener = (changes: browser.storage.ChangeDict, area: string) => {
    if (
      area === "sync" &&
      Object.keys(changes).indexOf(C.STORAGE_REMINDERALARMS) !== -1
    ) {
      this.setState({ reminders: changes[C.STORAGE_REMINDERALARMS].newValue });
    }
  };

  async componentDidMount() {
    const data = (await browser.storage.sync.get({
      [C.STORAGE_REMINDERALARMS]: {}
    }))[C.STORAGE_REMINDERALARMS];
    this.setState({ reminders: data });

    browser.storage.onChanged.addListener(this.listener);
  }

  cancel = (key: string) => async () => {
    if (confirm("Are you sure?")) {
      const reminders = this.state.reminders;
      if (!reminders) {
        console.warn("WARN: reminders undefined in cancel()");
        return;
      }
      delete reminders[key];
      await browser.storage.sync.set({
        [C.STORAGE_REMINDERALARMS]: (reminders as any)
      });
    }
  };

  render() {
    if (!this.state.reminders) {
      return (
        <div>
          <h1>Reminders</h1>
          <img src="https://sms.eursc.eu/resources/loading.gif" />
          <h2>Loading reminders, please wait...</h2>
        </div>
      );
    }
    if (Object.keys(this.state.reminders).length === 0) {
      return (
        <div>
          <h1>Reminders</h1>
          <h2>You don't have any!</h2>
          <p>Click "add reminder" on an exercise to create one.</p>
        </div>
      )
    }
    return (
      <div>
        <h1>Reminders</h1>
        {toPairs(this.state.reminders).map(tuple => {
          const [key, reminder] = tuple;
          return (
            <div key={key}>
              <div><em>{reminder.title}</em></div>
              <div>{dateFns.formatDistance(new Date(reminder.when), new Date())}</div>
              <button onClick={this.cancel(key)} className="ui-button">Cancel</button>
            </div>
          );
        })}
      </div>
    );
  }
}

ReactDOM.render(<Reminders />, document.getElementById("react_root"));
