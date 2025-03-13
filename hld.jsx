import React, { useState, useEffect } from "react";
import {AmountFrequency} from "../Controls";
import RadioSelect from "../Controls/RadioSelect.js";
import {currencyMaskString} from "../../utils/Mask.js"

const WarningMessage = ({ message }) => (
  <div className="itemflex mt-20 xsmallfont">
    <i className="far fa-exclamation-triangle"></i>
    <label>{message}</label>
  </div>
);

const convertToYearly = (amount, frequency) => {
  switch (frequency) {
    case 'Monthly':
      return amount * 12;
    case 'Weekly':
      return amount * 52;
    case 'Fortnightly':
      return amount * 26;
    case 'Daily':
      return amount * 365;
    default:
      return amount; // Assume yearly if no frequency is provided
  }
};

const HouseholdTable = ({
  locked,
  applicants,
  localIndExpenses,
  localTotalExpenses,
  selectedValue,
  labels,
  handleInputChange,
  handleDeleteHousehold,
}) => {
  const expensesArray =
    selectedValue === "2" ? localIndExpenses : localTotalExpenses;

  return (
    <div className="itemflexspace" id="Expenses">
      <div style={{ overflowX: "auto", width: "90%" }} className="lefttable">
        <table style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {expensesArray.map((_, index) => (
                <th
                  key={index}
                  style={{ minWidth: "300px", whiteSpace: "nowrap" }}
                >
                  <div className="itemflexspace small-input-box">
                    <div>Household {index + 1}</div>
                    <button
                      onClick={() => handleDeleteHousehold(index)}
                      className="edit-btn gap-10 clickable"
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {labels.map((label, rowIndex) => (
              <tr key={rowIndex}>
                {expensesArray.map((household, colIndex) => (
                  <td key={colIndex}>
                    <div className="input-group small-input-box">
                      <label>{label.description}</label>
                      {rowIndex > 2 ? (
                        <AmountFrequency
                        size="small"
                        locked={locked}
                          initialAmount={
                            (household[rowIndex] &&
                              household[rowIndex]?.value) ||
                            ""
                          }
                          initialFrequency={
                            (household[rowIndex] &&
                              household[rowIndex]?.frequency) ||
                            "Monthly"
                          }
                          onChange={(amount, frequency) =>
                            handleInputChange(
                              label.fieldName,
                              amount,
                              frequency,
                              rowIndex,
                              colIndex
                            )
                          }
                        />
                      ) : 
                      rowIndex==0 ?
                      (
                        <div className="input-group">
                          <select
                              name={label.fieldName}
                              multiple
                              readOnly={!locked}
                              value={household[rowIndex] && household[rowIndex]?.value || []}
                              onChange={(e) => {
                                const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                                handleInputChange(label.fieldName,selectedOptions, "", rowIndex, colIndex);
                              }}
                              className="multiselectbox declared-input"
                            >
                              {applicants?.map((applicant, index) => (
                                <option key={index} value={applicant.customerId}>
                                  {applicant.firstName} {applicant.lastName}
                                </option>
                              ))}
                            </select>
                        </div>
                      ):
                      (
                        <div className="input-group">
                          <input
                            name={label.fieldName}
                            type="number"
                            readOnly={!locked}
                            value={household[rowIndex] && household[rowIndex]?.value || ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              const maxValue = 20;
                              if (value <= maxValue) {
                                handleInputChange(label.fieldName,value, "", rowIndex, colIndex);
                              } else {
                                handleInputChange(label.fieldName,maxValue, "", rowIndex, colIndex);
                              }
                            }}
                            className="input-box"
                            style={{ width: '280px' }}
                          ></input>
                        </div>
                      )}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Fixed Right Column */}
      <div className="sidetable">
        <table style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Total</th>
            </tr>
            <tr></tr>
          </thead>
          <tbody>
            {labels?.map((label, rowIndex) => {
                if (rowIndex > 2) {
                  const total = (selectedValue == "2" ? localIndExpenses : localTotalExpenses).reduce((sum, household) => {
                  const value = (household[rowIndex] && household[rowIndex]?.value) || 0;
                  const frequency = (household[rowIndex] && household[rowIndex]?.frequency) || "Monthly";
                  const yearlyValue = convertToYearly(parseFloat(value), frequency);
                  return sum + yearlyValue;
                }, 0);
                
                return (
                  <tr key={rowIndex}>
                    <td>
                      <div style={{ marginTop: rowIndex==3 ? "81px" :"24px", fontSize: "1rem" }}>
                        {currencyMaskString(total.toFixed(2))}
                      </div>
                    </td>
                  </tr>
                );
              } else {
                return (
                  <tr key={rowIndex}>
                    <td>
                      <div style={{ marginTop: "45px" }}></div>
                    </td>
                  </tr>
                );
              }
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const Household = ({ locked, financials, onReturnFinancials, applicants }) => {
  const [localIndExpenses, setLocalIndExpenses] = useState([[{}]]);
  const [localTotalExpenses, setLocalTotalExpenses] = useState([[{}]]);
  const [radioValue, setRadioValue] = useState("1");

  useEffect(() => {
    const householdExpenses = financials?.householdExpenses;
    if (householdExpenses) {
      const {totalsOnly, individualExpenses, totalExpenses } = householdExpenses;
      if (
        JSON.stringify(individualExpenses) !== JSON.stringify(localIndExpenses)
      ) {
        setLocalIndExpenses(individualExpenses || [[{}]]);
      }
      if (
        JSON.stringify(totalExpenses) !== JSON.stringify(localTotalExpenses)
      ) {
        setLocalTotalExpenses(totalExpenses || [{}]);
      }
      if (totalsOnly) // below will reset the array and doens't keep any orphan records - but still need user to save
      {
        setLocalIndExpenses([{}]);
      } else setLocalTotalExpenses([{}]);
    }
  }, [financials]);

  const handleAddHousehold = () => {
    if (localIndExpenses.length < 4) {
        setLocalIndExpenses([...localIndExpenses, [{}]]);
        setLocalTotalExpenses([...localTotalExpenses, [{}]]);
    }
};
  const handleDeleteHousehold = (index) => {
    const newHouseholds = localIndExpenses.filter((_, i) => i !== index);
    setLocalIndExpenses(newHouseholds);
    const newTotalExpenses = localTotalExpenses.filter((_, i) => i !== index);
    setLocalTotalExpenses(newTotalExpenses);

    onReturnFinancials({
      householdExpenses: {
        totalExpenses: newTotalExpenses,
        individualExpenses: newHouseholds,
        totalsOnly: radioValue==="1" ? true : false
      },
    });
  };

  const handleInputChange = (fieldName, value, frequency, labelIndex, householdIndex) => {
    const newHouseholds = radioValue === "1" ? [...localTotalExpenses] : [...localIndExpenses];
  
    // Ensure the household array exists
    if (!newHouseholds[householdIndex]) {
      newHouseholds[householdIndex] = [];
    }
  
    // Update the value and frequency
    newHouseholds[householdIndex][labelIndex] = {
      fieldName,
      value,
      frequency,
    };
  
    if (radioValue === "1") {
      setLocalTotalExpenses(newHouseholds);
    } else if (radioValue === "2") {
      setLocalIndExpenses(newHouseholds);
    }
  
    onReturnFinancials({
      householdExpenses: {
        totalExpenses: radioValue === "1" ? newHouseholds : localTotalExpenses,
        individualExpenses: radioValue === "2" ? newHouseholds : localIndExpenses,
        totalsOnly: radioValue === "1",
      },
    });
  };
  const radioOptions = [
    { value: "1", label: "Total Living Expenses" },
    { value: "2", label: "Individual Expenses" }
  ];

  const handleSelection = () => {
    const value = radioValue === "1" ? "2" : "1";
    setRadioValue(value);
    onReturnFinancials({
      householdExpenses: {
        totalExpenses: localTotalExpenses,
        individualExpenses: localIndExpenses,
        totalsOnly: value== "1" ? true : false
      },
    });
  }

  const labels =
  radioValue === "1"
    ? [
        { fieldName: 'applicantsInHousehold', description: 'Applicants in household' },
        { fieldName: 'adultsOver18', description: 'Adults over 18' },
        { fieldName: 'dependantsUnder18', description: 'Dependants under 18' },
        { fieldName: 'basicLivingExpenses', description: 'Basic Living Expenses' },
        { fieldName: 'otherAdditionalExpenses', description: 'Other Additional Expenses' }
      ]
    : [
        { fieldName: 'applicantsInHousehold', description: 'Applicants in household' },
        { fieldName: 'adultsOver18', description: 'Adults over 18' },
        { fieldName: 'dependantsUnder18', description: 'Dependants under 18' },
        { fieldName: 'foodAndGroceries', description: 'Food and Groceries' },
        { fieldName: 'primaryResidenceUtility', description: 'Primary Residence Utility' },
        { fieldName: 'communication', description: 'Communication' },
        { fieldName: 'tertiaryAndPublicEducation', description: 'Tertiary and Public Education' },
        { fieldName: 'clothingAndPersonalCare', description: 'Clothing and Personal Care' },
        { fieldName: 'transportAndAuto', description: 'Transport and Auto' },
        { fieldName: 'medicalHealthAndFitness', description: 'Medical, Health and Fitness' },
        { fieldName: 'insurance', description: 'Insurance' },
        { fieldName: 'recreationTravelAndEntertainment', description: 'Recreation, Travel and Entertainment' },
        { fieldName: 'childrenAndPets', description: 'Children and Pets' },
        { fieldName: 'expensesForAuditDependents', description: 'Expenses for audit Dependents' },
        { fieldName: 'otherAdditionalExpenses', description: 'Other Additional Expenses' }
      ];

  return (
    <div className="itemflexcol">
      <WarningMessage message="Total household expenses of greater than $0.00 must be entered for Household 1." />
      <WarningMessage message="All applicants must be linked to a household." />
      
      <div className="linebreak"></div>
      <RadioSelect
        options={radioOptions}
        selectedValue={radioValue}
        onChange={handleSelection}
      />

      <HouseholdTable
        locked={locked}
        applicants={applicants}
        localIndExpenses={localIndExpenses}
        localTotalExpenses={localTotalExpenses}
        selectedValue={radioValue}
        labels={labels}
        handleInputChange={handleInputChange}
        handleDeleteHousehold={handleDeleteHousehold}
      />

      <div className="itemflex mt-20">
        <button className="add-btn gap-10 mb-10" onClick={handleAddHousehold}>
          <i className="fas fa-plus"></i>&nbsp;Add Household
        </button>
      </div>
      <div className="underline mt-20"></div>
    </div>
  );
};

export default Household;
