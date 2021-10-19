"use strict";
if (document.title == "Transparency Government in Fact - Home Page") {
    let read = document.getElementById("moreLess");
    read.addEventListener("click", event => { handleLink(event) });
    function handleLink(e) { e.target.innerText = e.target.innerText === "Read More" ? "Read Less" : "Read More" }
} else {
    var loader = document.getElementById("loader");
    var main = document.getElementsByTagName("main")[0];
    main.classList.remove("flex-grow-1");
    main.classList.add("d-none");
    var loaderBar = document.getElementById("progressLoader");
    const changeProgress = (progress, ...paramN) => {
        loaderBar.style.width = `${progress}%`;
        if (paramN.length) {
            loaderBar.parentElement.remove();
            let errorMessage = document.createElement("p");
            errorMessage.className = "text-danger text-center my-2"
            errorMessage.innerHTML = `Failure to load ProPublica API <br> ${paramN[0].message}`;
            loader.appendChild(errorMessage);
            console.error(paramN[0].message);
        }
    };
    let init = {
        headers: {
            "X-API-Key": "1nMzQc2PrIQBplWlZQRd1odsZmcXKwGx9d8yddHP",
        }
    };
    changeProgress(35);
    let chamber = document.title.includes("Congressmen") ? "house" : "senate";
    fetch(`https://api.propublica.org/congress/v1/113/${chamber}/members.json`, init)
        .then((res) => {
            changeProgress(85);
            return res.json()
        })
        .then(json => mainFunction(json.results[0].members))
        .catch(err => changeProgress(100, err));
    function mainFunction(members) {
        changeProgress(100);
        loader.className = "d-none";
        main.classList.remove("d-none");
        main.classList.add("flex-grow-1");
        let table = document.getElementsByTagName("table");
        let tableBody = document.getElementsByTagName("tbody"),
            tableFooter = document.getElementsByTagName("tfoot")[0],
            statesSelect = document.getElementsByTagName("select")[0],
            checkBoxes = document.getElementsByClassName("checkboxJS"),
            states = [];
        let partyChecked = [];
        const statistics = {
            membersLeastEngaged: members.map(member => member).sort((memberA, memberB) => memberB.missed_votes_pct - memberA.missed_votes_pct),
            membersMostEngaged: members.filter(member => member.total_votes > 0).sort((memberA, memberB) => memberA.missed_votes_pct - memberB.missed_votes_pct),
            membersLeastLoyal: members.filter(member => member.total_votes > 0).sort((memberA, memberB) => memberA.votes_with_party_pct - memberB.votes_with_party_pct),
            membersMostLoyal: members.map(member => member).sort((memberA, memberB) => memberB.votes_with_party_pct - memberA.votes_with_party_pct),
            democratsMembers: members.filter(member => member.party == "D"),
            republicansMembers: members.filter(member => member.party == "R"),
            independentsMembers: members.filter(member => member.party == "ID"),
            totalDemocrats: members.filter(member => member.party == "D").length,
            totalRepublicans: members.filter(member => member.party == "R").length,
            totalIndependents: members.filter(member => member.party == "ID").length,
            averageDemoMissedVotes: calculateAverage("D", "missed_votes_pct"),
            averageRepuMissedVotes: calculateAverage("R", "missed_votes_pct"),
            averageIndeMissedVotes: calculateAverage("ID", "missed_votes_pct"),
            averageDemoVotesWParty: calculateAverage("D", "votes_with_party_pct"),
            averageRepuVotesWParty: calculateAverage("R", "votes_with_party_pct"),
        }

        if (table[0].id == "house" || table[0].id == "senate") {
            let columnName = document.getElementsByTagName("th")[0];
            let columnSeniority = document.getElementsByTagName("th")[3];
            members.forEach(member => {
                addRow(member, 0);
                if (!states.includes(member.state)) {
                    states.push(member.state);
                }
                if (!partyChecked.includes(member.party)) {
                    partyChecked.push(member.party);
                }
            });
            states = states.sort();
            states.forEach(state => {
                let option = document.createElement("option");
                option.value = state;
                option.innerText = state;
                statesSelect.appendChild(option);
            });
            statesSelect.addEventListener("change", event => handleTBody(event.target));

            checkBoxes = Array.from(checkBoxes);
            checkBoxes.forEach(checkBox => {
                checkBox.checked = true;
                checkBox.addEventListener("change", event => handleTBody(event.target));
            });
            columnName.addEventListener("click", event => sortBy(event));
            columnSeniority.addEventListener("click", event => sortBy(event));
        } else {
            var flag = document.getElementsByTagName("th")[5].innerText === "% Missed";
            if (flag) {
                renderGlance("MissedVotes");
                renderLeastMost(statistics.membersLeastEngaged, "missed_votes_pct", 1);
                renderLeastMost(statistics.membersMostEngaged, "missed_votes_pct", 2);

            } else {
                renderGlance("VotesWParty");
                renderLeastMost(statistics.membersLeastLoyal, "votes_with_party_pct", 1);
                renderLeastMost(statistics.membersMostLoyal, "votes_with_party_pct", 2);
            }
        }
        function handleTBody(input, ...paramN) {
            tableBody[0].innerHTML = "";
            let stateAux = statesSelect.value;
            if (input.name == "party") {
                if (!input.checked) {
                    partyChecked = partyChecked.filter(party => party !== input.value)
                } else {
                    partyChecked.push(input.value);
                }
            };
            let membersAux = members.filter(member => (member.state === stateAux || stateAux == "all") && (partyChecked.includes(member.party)))
            membersAux.sort((memberA, memberB) => memberA.govtrack_id - memberB.govtrack_id);
            if (paramN.length) {
                if (paramN[0].byName) {
                    paramN[0].arrow ? membersAux.sort((memberA, memberB) => ((memberA.last_name + memberA.first_name + (memberA.middle_name || "")) > (memberB.last_name + memberB.first_name + (memberB.middle_name || ""))) ? 1
                                                                            : (((memberA.last_name + memberA.first_name + (memberA.middle_name || "")) < (memberB.last_name + memberB.first_name + (memberB.middle_name || ""))) ? -1 : 0))
                                    : membersAux.sort((memberA, memberB) => ((memberB.last_name + memberB.first_name + (memberB.middle_name || "")) > (memberA.last_name + memberA.first_name + (memberA.middle_name || ""))) ? 1
                                                                            : (((memberB.last_name + memberB.first_name + (memberB.middle_name || "")) < (memberA.last_name + memberA.first_name + (memberA.middle_name || ""))) ? -1 : 0));
                } else {
                    paramN[0].arrow ? membersAux.sort((memberA, memberB) => memberA.seniority - memberB.seniority)
                        : membersAux.sort((memberA, memberB) => memberB.seniority - memberA.seniority);
                }
            }
            membersAux.forEach(member => {
                addRow(member, 0);
            });
            if (membersAux.length === 0) {
                let row = document.createElement("tr");
                row.innerHTML = `<td colspan="5" class="text-danger"> No member of the ${document.getElementsByTagName("h2")[0].innerText === "Senators" ? "Senate" : "House"} has passed the filters </td>`;
                tableBody[0].appendChild(row);
            }
        }
        function renderLeastMost(membersStatistics, thirdColProp, numberTBody) {
            let membersAux = [];
            membersStatistics.forEach((member, index, arr) => {
                let row = document.createElement("tr");
                let percentage = flag ? member.missed_votes :
                    parseInt((member.total_votes - member.missed_votes) * member.votes_with_party_pct / 100);
                if ((index + 1) <= (Math.round(members.length * 0.1))) {
                    addNameWithLink(member, `${numberTBody === 1 ? "text-danger" : "text-primary"}`, row);
                    addData(percentage, row);
                    addData(member[thirdColProp].toFixed(2) + "%", row);
                    tableBody[numberTBody].appendChild(row);
                    membersAux.push(member);
                };
                if (arr[Math.round(members.length * 0.1) - 1][thirdColProp] === member[thirdColProp] && index != Math.round(members.length * 0.1) - 1) {
                    if (!membersAux.includes(member)) {
                        addNameWithLink(member, `${numberTBody === 1 ? "text-danger" : "text-primary"}`, row);
                        addData(percentage, row);
                        addData(member[thirdColProp].toFixed(2) + "%", row);
                        tableBody[numberTBody].appendChild(row);
                        membersAux.push(member);
                    }
                }
            });
        }
        function renderGlance(thirdColProp) {
            Array.from(tableBody[0].children).forEach((row, i) => {
                switch (i) {
                    case 0:
                        addData(statistics.totalRepublicans, row, { attrName: "class", attrValue: "border border-1 border-danger" });
                        addData(statistics[`averageRepu${thirdColProp}`] + "%", row, { attrName: "class", attrValue: "border border-1 border-danger" });
                        break;
                    case 1:
                        addData(statistics.totalDemocrats, row, { attrName: "class", attrValue: "border border-1 border-danger" });
                        addData(statistics[`averageDemo${thirdColProp}`] + "%", row, { attrName: "class", attrValue: "border border-1 border-danger" });
                        break;
                    case 2:
                        addData(statistics.totalIndependents, row, { attrName: "class", attrValue: "border border-1 border-danger" });
                        addData(`${statistics[`averageInde${thirdColProp}`] ? statistics[`averageInde${thirdColProp}`] + "%" : "NOT APPLY"}`, row, { attrName: "class", attrValue: "border border-1 border-danger" });
                        break;
                }
            });
            addData((statistics.totalDemocrats + statistics.totalRepublicans + statistics.totalIndependents), tableFooter.children[0], { attrName: "class", attrValue: "border border-1 border-danger" })
            let logo = document.createElement("td");
            logo.innerHTML = '<img src="../assets/logo.png" alt="logoTGIF" width="100">';
            tableFooter.children[0].appendChild(logo);
        }
        function addRow(member, i) {
            let row = document.createElement("tr");
            addNameWithLink(member, "text-danger", row);
            addData(member.party, row);
            addData(member.state, row);
            addData(member.seniority, row);
            addData(member.votes_with_party_pct.toFixed(2) + "%", row);
            tableBody[i].appendChild(row);
        }
        function addNameWithLink(member, textClass, row) {
            let memberName = document.createElement("td");
            let memberLink = document.createElement("a");
            memberLink.className = textClass;
            memberLink.href = member.url;
            memberLink.target = "_blank";
            memberLink.innerText = `${member.last_name}, ${member.first_name} ${member.middle_name || ""}`;
            memberName.appendChild(memberLink);
            row.appendChild(memberName);
        }
        function addData(text, row, ...attributes) {
            let memberData = document.createElement("td");
            memberData.innerText = text;
            attributes.forEach(attribute => {
                memberData.setAttribute(attribute.attrName, attribute.attrValue);
            })
            row.appendChild(memberData);
        }
        function calculateAverage(party, votes) {
            let membersParty = members.filter(member => member.party === party);
            let total = membersParty.length;
            if (total) {
                membersParty = membersParty.map(member => member[votes]);
                let accumulator = membersParty.reduce((accumulator, memberPropertie) => accumulator + memberPropertie);
                return parseFloat(accumulator / total).toFixed(2)
            } else {
                return 0;
            }
        }
        function sortBy(e) {
            let th = e.target.tagName == "I" ? e.target.parentElement : e.target;
            let header = th.innerText.includes("Name");
            let descendent = th.children[0].className.includes("down");
            th.children[0].className = descendent ? "bi bi-arrow-up-short" : "bi bi-arrow-down-short";
            handleTBody(false, { byName: header, arrow: descendent });
        }
    };
}