////
// Budget controller module
////
var budgetController =  (function()
{

  var Expense = function(id, description, value)
  {
    this.id = id;
    this.description = description;
    this.value = value;
    this.percentage = -1;
  };

  Expense.prototype.calculatePercentage = function(totalIncome)
  {
    if (totalIncome > 0)
    {
      this.percentage = Math.round((this.value / totalIncome) * 100);
    }
    else
    {
      this.percentage = -1;
    }
  };

  Expense.prototype.getPercentage = function()
  {
    return this.percentage;
  }

  var Income = function(id, description, value)
  {
    this.id = id;
    this.description = description;
    this.value = value;
  };

  var calculateTotal = function(type)
  {
    var sum = 0;

    data.allItems[type].forEach(function(current)
    {
      sum += current.value;
    });
    data.totals[type] = sum;
  };

  var data =
  {
    allItems:
    {
      exp: [],
      inc: []
    },
    totals:
    {
      exp: 0,
      inc: 0
    },
    budget: 0,
    // -1 used for non-existant values
    percentage: -1
  };

  return {
    addItem: function(type, desc, val)
    {
      var newItem, id;

      // Create new ID
      if (data.allItems[type].length > 0)
      {
        id = (data.allItems[type][data.allItems[type].length - 1].id) + 1;
      }
      else
      {
        id = 0;
      }

      // Check if we need to create a new expense or income based on form value
      if(type === "exp")
      {
        newItem = new Expense(id, desc, val);
      }
      else if (type === "inc")
      {
        newItem = new Income(id, desc, val);
      }

      // Push new item into data structure
      data.allItems[type].push(newItem);

      // Return the new element to make it public
      return newItem;
    },

    deleteItem: function(type, id)
    {
      // ID of object not necessarily index in array
      // so need to retrieve index
      var ids, index;

      ids = data.allItems[type].map(function(current)
      {
        return current.id;
      });

      index = ids.indexOf(id);

      if (index !== -1)
      {
        data.allItems[type].splice(index, 1);
      }
    },

    calculateBudget: function()
    {
      // Calculate total income and expenses
      calculateTotal("exp");
      calculateTotal("inc");

      // Calculate the budget: income - expenses
      data.budget = data.totals.inc - data.totals.exp;

      // Calculate the percentage of income that we spend
      if (data.totals.inc > 0)
      {
        data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);
      }
      else
      {
        data.percentage = -1;
      }
    },

    calculatePercentages: function()
    {
      data.allItems.exp.forEach(function(current)
      {
        current.calculatePercentage(data.totals.inc);
      });
    },

    getPercentages: function()
    {
      // map returns a value, forEach does not
      var allPercentages = data.allItems.exp.map(function(current)
      {
        return current.getPercentage();
      });
      return allPercentages;
    },

    getBudget: function()
    {
      return {
        budget: data.budget,
        totalInc: data.totals.inc,
        totalExp: data.totals.exp,
        percentage: data.percentage
      }
    },

    testing: function()
    {
      console.log(data);
    }
  };

}
)();

////
// UI controller module
////
var UIController = (function()
{
  var DOMStrings =
  {
      inputType: ".add__type",
      inputDescription: ".add__description",
      inputValue: ".add__value",
      inputBtn: ".add__btn",
      incomeContrainer: ".income__list",
      expensesContrainer: ".expenses__list",
      budgetLabel: ".budget__value",
      incomeLabel: ".budget__income--value",
      expensesLabel: ".budget__expenses--value",
      percentageLabel: ".budget__expenses--percentage",
      container: ".container",
      expensesPercentageLabel: ".item__percentage",
      dateLabel: ".budget__title--month"
  };

  var formatNumber = function(number, type)
  {
    var numSplit, int, dec, sign;
    // +/- before number
    // exactly 2 decimal points
    // comma separating thousands

    number = Math.abs(number);
    number = number.toFixed(2);

    // Splitting number to format decimals
    numSplit = number.split(".");
    int = numSplit[0];
    // Add comma to break thousands for readability
    if(int.length > 3)
    {
      int = int.substr(0, int.length - 3) + "," + int.substr(int.length - 3, int.length);
    }
    dec = numSplit[1];

    return (type === "exp" ? sign = "-" : sign = "+") + " " + int + "." + dec;
  };

  var nodeListForEach = function(list, callback)
  {
    for (var i = 0; i < list.length; i++)
    {
      callback(list[i], i);
    };
  };

  return {
    getInput: function()
    {
      return {
        type: document.querySelector(DOMStrings.inputType).value, // Will be either inc or exp
        description: document.querySelector(DOMStrings.inputDescription).value,
        value: parseFloat(document.querySelector(DOMStrings.inputValue).value)
      }
    },

    addListItem: function(obj, type)
    {
      var html, newhtml, element;
      // 1. Create HTML string with placeholder text

      if (type === "inc")
      {
        element = DOMStrings.incomeContrainer;
        html = '<div class="item clearfix" id="inc-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
      }
      else if (type === "exp")
      {
        element = DOMStrings.expensesContrainer;
        html = '<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
      }

      // 2. Replace placeholder text with some actual data
      newhtml = html.replace("%id%", obj.id);
      newhtml = newhtml.replace("%description%", obj.description);
      newhtml = newhtml.replace("%value%", formatNumber(obj.value, type));

      // 3. Insert HTML into the DOM
      document.querySelector(element).insertAdjacentHTML("beforeend", newhtml);

    },

    deleteListItem: function(selectorId)
    {
      var element = document.getElementById(selectorId);
      element.parentNode.removeChild(element);
    },

    clearFields: function()
    {
      var fields, fieldsArray;
      fields = document.querySelectorAll(DOMStrings.inputDescription + ", " + DOMStrings.inputValue);

      // Convert list to array
      fieldsArray = Array.prototype.slice.call(fields);

      fieldsArray.forEach(function(current, index, array)
      {
        current.value = "";
      });

      fieldsArray[0].focus();
    },

    displayBudget: function(obj)
    {
      obj.budget > 0 ? type = "inc" : type = "exp";
      document.querySelector(DOMStrings.budgetLabel).textContent = formatNumber(obj.budget, type);
      document.querySelector(DOMStrings.incomeLabel).textContent = formatNumber(obj.totalInc, "inc");
      document.querySelector(DOMStrings.expensesLabel).textContent = formatNumber(obj.totalExp, "exp");

      if (obj.percentage > 0)
      {
        document.querySelector(DOMStrings.percentageLabel).textContent = obj.percentage + "%";
      }
      else
      {
        document.querySelector(DOMStrings.percentageLabel).textContent = "---";
      }

    },

    displayPercentages: function(percentages)
    {
      var fields = document.querySelectorAll(DOMStrings.expensesPercentageLabel);

      nodeListForEach(fields, function(current, index)
      {
        if (percentages[index] > 0)
        {
          current.textContent = percentages[index] + "%";
        }
        else
        {
          current.textContent = "---";
        }
      });
    },

    displayMonth: function()
    {
      var now, year, months, month;

      now = new Date();
      year = now.getFullYear();
      months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      month = now.getMonth();
      document.querySelector(DOMStrings.dateLabel).textContent = months[month] + " " + year;
    },

    changedType: function()
    {
      var fields = document.querySelectorAll  (
                                                DOMStrings.inputType + ", " +
                                                DOMStrings.inputDescription + ", " +
                                                DOMStrings.inputValue
                                              );
      nodeListForEach(fields, function(current)
      {
        current.classList.toggle("red-focus");
      });
      
      document.querySelector(DOMStrings.inputBtn).classList.toggle("red");
    },

    getDOMStrings: function()
    {
      return DOMStrings;
    }
  };

}
)();

// Global app controller module
var controller = (function(fncBdgt, fncUI){

  var setupEventListeners = function()
  {
    var DOM = fncUI.getDOMStrings();

    document.querySelector(DOM.inputBtn).addEventListener("click", ctrlAddItem);

    document.addEventListener("keypress", function(event)
    {

      if (event.keyCode === 13 || event.which === 13)
      {
        ctrlAddItem();
      }
    });

    document.querySelector(DOM.container).addEventListener("click", ctrlDeleteItem);

    document.querySelector(DOM.inputType).addEventListener("change", fncUI.changedType);

  };

  var updatePercentages = function()
  {
    // 1. Calculate percentages
    fncBdgt.calculatePercentages();

    // 2. Read percentages from the budget controller
    var percentages = fncBdgt.getPercentages();

    // 3. Update the UI with the new percentages
    fncUI.displayPercentages(percentages);
  };

  var updateBudget = function()
  {

    // 1. Calculate the budget
    fncBdgt.calculateBudget();

    // 2. Return the budget
    var budget = fncBdgt.getBudget();

    // 3. Display the budget on the UI
    fncUI.displayBudget(budget);

  };

  var ctrlAddItem = function()
  {

    var input, newItem;

    // TODO:

    // 1. Get Input data
    input = fncUI.getInput();

    // Check for completed values on input
    if (input.description !== "" && !isNaN(input.value) && input.value > 0)
    {
      // 2. Add item to the budget controller
      newItem = fncBdgt.addItem(input.type, input.description, input.value);

      // 3. Add the item to the UI
      fncUI.addListItem(newItem, input.type);

      // 4. Clear fields
      fncUI.clearFields();

      // 5. Calculate and update budget
      updateBudget();

      // 6. Calculate and update percentages
      updatePercentages();
    }

  };

  var ctrlDeleteItem = function(event)
  {
    var itemID, splitID, type, id;
    itemID = event.target.parentNode.parentNode.parentNode.parentNode.id;

    if (itemID)
    {
      // Gets the item-# id from the DOM object
      splitID = itemID.split("-");
      type = splitID[0];
      id = parseInt(splitID[1]);

      // 1. Delete the item from the data structure
      fncBdgt.deleteItem(type, id);

      // 2. Delete the item from the UI
      fncUI.deleteListItem(itemID);

      // 3. Update and show the new budget
      updateBudget();

      // 4. Calculate and update percentages
      updatePercentages();
    }
  };

  return {
    init: function()
    {
      console.log("Application started.");
      setupEventListeners();
      fncUI.displayBudget(
      {
        budget: 0,
        totalInc: 0,
        totalExp: 0,
        percentage: 0
      });
      fncUI.displayMonth();
    }
  };

}
)(budgetController, UIController);

controller.init();
