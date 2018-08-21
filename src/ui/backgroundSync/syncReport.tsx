import React from "react";
import ReactDOM from "react-dom";
import * as dateFns from "date-fns";

import * as C from "../../util/constants";
import { SyncReportType } from "features/background-sync";

interface State {
    report?: SyncReportType;
    reportId?: string;
    error?: string | Error;
}

const styles: {[k: string]: React.CSSProperties} = {
    card: {
        boxShadow: "0 4px 8px 0 rgba(0,0,0,0.2);",
        padding: "0.1em",
        margin: "1em"
    },
    container: {
        maxWidth: 800,
        margin: "0 auto",
    }
};

class SyncReport extends React.Component<{}, State> {
    constructor(props: {}) {
        super(props);
        this.state = {};
    }

    async componentDidMount() {
        const prefix = C.SYNC_QUERY_PREFIX;
        const reportId = window.location.search.substring(prefix.length);
        debugger;

        const key = C.STORAGE_SYNC_REPORT + reportId;
        const store = await browser.storage.local.get(key);
        const report = store[key] as SyncReportType | null | undefined;
        if (!report) {
            this.setState({
                error: "Sync report null or undefined"
            });
            return;
        }
        this.setState({
            report,
            reportId
        });
    }

    render() {
        const {error, report, reportId} = this.state;
        if (error) {
            return (
                <div style={styles.container}>
                    <h1>Error!</h1>
                    <p>Sorry, there was an error: </p>
                    <code>
                        {error}
                    </code>
                </div>
            );
        }
        if (!error && !report) {
            return (
                <div style={styles.container}>
                    <p>Loading sync result, please wait just a second...</p>
                </div>
            );
        }
        return (
            <div style={styles.container}>
                <h1>Schedule Sync Report</h1>
                <h2>Generated at {dateFns.format(parseInt(reportId!, 10), "YYYY-MM-dd GGGG HH:mm ")}</h2>

                <div>
                    <h3>Added</h3>
                    <p>These are schedule entries that weren't there before</p>
                    {report!.added.map(entry => (
                        <div key={`${entry.id}-${entry.start}`} style={styles.card}>
                            <b>{entry.title}</b>
                            <div>{dateFns.format(entry.start, "EEEE")} {entry.param_2.replace("          -", "")}</div>
                            <div>{entry.teacher_name_list} - {entry.param_1}</div>
                        </div>
                    ))}
                </div>

                <div>
                    <h3>Changed</h3>
                    <p>These are schedule entries that were changed</p>
                    {report!.changed.map((entry, index) => (
                        <div key={`${entry.id}-${entry.start}-${index}`} style={styles.card}>
                            <table>
                                <thead>
                                    <tr>
                                        <td>Field</td>
                                        <td>Old Value</td>
                                        <td>New Value</td>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.keys(entry).map(key => (
                                        <tr key={key}>
                                            <td>{key}</td>
                                            <td>{(entry as any)[key].old}</td>
                                            <td>{(entry as any)[key].new}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>

                <div>
                    <h3>Removed</h3>
                    <p>These are schedule entries that are no longer there</p>
                    {report!.removed.map(entry => (
                        <div key={`${entry.id}-${entry.start}`} style={styles.card}>
                            <b>{entry.title}</b>
                            <div>{dateFns.format(entry.start, "dddd")} {entry.param_2.replace("          -", "")}</div>
                            <div>{entry.teacher_name_list} - {entry.param_1}</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
}

ReactDOM.render(<SyncReport />, document.getElementById("react_root"));

