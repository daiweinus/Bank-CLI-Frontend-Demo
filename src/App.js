import React, {useEffect, useState} from 'react';
import './App.css';

function App() {
    const initialResponse = [{
        commandText: '',
        helloText: '',
        transferredText: [],
        loginOweText: [],
        balanceText: '',
        oweText: [],
        message: ''
    }];
    const [responseArray, setResponseArray] = useState(initialResponse)

    let command = '';

    useEffect(() => {

        // command listener
        const listener = event => {
            if (event.code !== "Enter") {
                return;
            }
            event.preventDefault();
            command = document.getElementById("command").value;
            document.getElementById("command").value = '';
            let commandArr = command.split(" ");
            let action = commandArr[0].toLowerCase();

            switch (action) {
                case 'login': {
                    if (commandArr.length !== 2) {
                        showError(command);
                        return;
                    }
                    localStorage.setItem('loginUser', capitalize(commandArr[1]));
                    let data = "userName=" + capitalize(commandArr[1]);
                    return callBackendAPI(action, data)
                }

                case 'topup': {
                    let loginClient = localStorage.getItem('loginUser');
                    if (commandArr.length !== 2 || isNumeric(commandArr[1]) === false) {
                        showError(command);
                        return;
                    }
                    let data = "userName=" + loginClient + "&amount=" + commandArr[1];
                    return callBackendAPI(action, data)
                }

                case 'pay': {
                    let loginClient = localStorage.getItem('loginUser');
                    if (commandArr.length !== 3 || isNumeric(commandArr[2]) === false) {
                        showError(command);
                        return;
                    }
                    let anotherClientName = capitalize(commandArr[1]);
                    let data = "userName=" + loginClient + "&anotherUserName=" + anotherClientName + "&amount=" + commandArr[2];
                    return callBackendAPI(action, data)
                }

                case 'clear': {
                    setResponseArray(initialResponse);
                    return
                }

                default: {
                    showError(command);
                    return
                }


            }
        };

        //call backend API
        function callBackendAPI(action, data) {
            const requestOptions = {
                method: 'POST',
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                body: data
            };
            fetch('/command/' + action, requestOptions)
                .then(response => response.json())
                .then(responseJson => {
                    if (responseJson.isSuccess) {
                        //parsing response object
                        let data = responseJson.data;
                        let helloText = '';
                        if (action === 'login') {
                            helloText = 'Hello, ' + data.user.user + '!';
                        }
                        let transferredText = [];
                        if (responseJson.transfer && responseJson.transfer.length > 0) {
                            transferredText = responseJson.transfer;
                        }
                        let loginOweText = [];
                        if (data.collection.length > 0) {
                            loginOweText = data.collection;
                        }
                        let balanceText = 'Your balance is $' + data.user.balance + '.' + '\n';
                        let oweText = [];
                        if (data.debt.length > 0) {
                            oweText = data.debt;
                        }
                        let res = {
                            commandText: '> ' + command,
                            helloText: helloText,
                            transferredText: transferredText,
                            loginOweText: loginOweText,
                            balanceText: balanceText,
                            oweText: oweText
                        }
                        setResponseArray(oldArray => [...oldArray, res]);
                        checkSpanHidden()
                    } else {
                        let errorMessage = responseJson.errorMessage;
                        showError(command, errorMessage);
                    }
                })
                .catch(console.error);
        }

        // error message
        function showError(commandText, errMsg) {
            let message = 'Sorry, this command is undefined, please try again.'
            if (errMsg != null && errMsg !== '') {
                message = errMsg;
            }
            let res = {
                commandText: '> ' + commandText,
                helloText: '',
                transferredText: [],
                loginOweText: [],
                balanceText: '',
                oweText: [],
                message: message
            }
            setResponseArray(oldArray => [...oldArray, res]);
            checkSpanHidden()
        }

        //check hidden span
        function checkSpanHidden() {
            const spanList = document.querySelectorAll("span");
            spanList.forEach(span => {
                if (span.innerText === '') {
                    span.classList.add('hidden');
                } else {
                    span.classList.remove('hidden');
                }
            });
        }

        //check if numeric
        function isNumeric(num) {
            return !isNaN(num)
        }

        //capitalize username
        function capitalize(name) {
            return name.substring(0, 1).toUpperCase() + name.substring(1).toLowerCase();
        }

        document.addEventListener("keydown", listener);
        return () => {
            document.removeEventListener("keydown", listener);
        };
    }, []);

    return (
        <div>
            <div id="command-container">
                {responseArray.map(response => (
                    <div>
                        <span className="app-text hidden">{response.commandText}</span>
                        <span className="app-text hidden">{response.helloText}</span>
                        {response.transferredText.map(transfer => (
                            <span
                                className="app-text hidden">Transferred ${transfer.transactedAmount} to {transfer.transactedUser}.</span>
                        ))}
                        {response.loginOweText.map(collect => (
                            <span
                                className="app-text hidden">Owing ${collect.amount} from {collect.collectionName}.</span>
                        ))}
                        <span className="app-text hidden">{response.balanceText}</span>
                        {response.oweText.map(debt => (
                            <span className="app-text hidden">Owing ${debt.amount} to {debt.debtUser}.</span>
                        ))}
                        <span className="app-text hidden">{response.message}</span>
                        <span className="app-text">&nbsp;</span>
                    </div>
                ))}
            </div>
            <span>>&nbsp;
                <input type="text" id="command"  autoFocus>
                </input>
            </span>
        </div>
    );
}

export default App;

