'use strict';

(function() {
	/*
		CONSTANT VALUES
	*/
	var regex = /<div\sclass="message_header"><span\sclass="user">(.{1,15}\b\s\b.{1,15}(?:\s.{1,15}){0,2})<\/span><span\sclass="meta">(.{1,10},\s\b.{1,10}\b\s\b\d{1,2},\s\b\d{4})/g
	var dateRegex = /\w{5,15},\s(\w{3,15})\s\d{1,2},\s(\d{4})/g
	var monthDateRegex = /(\w{4,15})\s(\d{4})/g
	var file = undefined
	var months = {
		'en': {
			name: 'English',
			list: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
		},
		'fr': {
			name: 'Français',
			list: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
		}
	}

	/*
		BUSINESS CLASSES
	*/

	/*
		MONTHDATE CLASS

		Creation of the MonthDate class, for the monthList function purposes
	*/

	function MonthDate (str, language) {
		this.month = getMonth(str)
		this.year = getYear(str)
		this.language = language
	}

	MonthDate.prototype.toString = function () {
		// Returns string format of the MonthDate object
		return this.month + ' ' + this.year.toString()
	}

	MonthDate.prototype.nextMonth = function () {
		// Returns a MonthDate object of the month following this one
		if (months[this.language].list.indexOf(this.month) === months[this.language].length) {
			// last month
			return new MonthDate(months[this.language].list[0] + ' ' + new Number(this.year + 1).toString(), this.language)
		} else {
			// not last month
			return new MonthDate(months[this.language].list[months[this.language].list.indexOf(this.month) + 1] + ' ' + this.year.toString(), this.language)
		}
	}

	/*
		FILE PROCESSING FUNCTIONS

		1. BROWSER FILE PROCESSING FUNCTIONS
		2. FILE EXTRACTION FUNCTIONS
	*/

	/*
		1. BROWSER FILE PROCESSING FUNCTIONS
	*/

	function processFile(n, f, l) {
		// Reading file and calling callback function
		var reader = new FileReader()
		reader.onload = function(e) {
			var fileContent = e.target.result
			docLog('File charged.')
			var content = contentProcess(fileContent, n, l)
			processGraph(content.values, content.dates, content.names)
		}
		docLog('Loading file in memory...')
		reader.readAsText(f)
	}

	/*
		2. FILE EXTRACTION FUNCTIONS
	*/

	function contentProcess (content, username, language) {
		/*
		content: Content of the messages.htm file (string)
		username (optional): User Facebook name
		If username has been provided, the entries of the return array where the name is the
		given username are filtered out.

		returns: {
			'values': [['name1', 'Month YEAR'], ['name2', 'Month YEAR'], ...],
			'dates': ['January 2014', 'February 2014', ...],
			'names': Set of names
		}
		with the first value of 'dates' being the minimum date in 'values'
		*/
		var listOfMessages = []
		docLog('Parsing file content...')
		content.replace(regex, function (_, name, date) { listOfMessages.push([name, date]) })
		listOfMessages.forEach(function (mess) {
			mess[1] = mess[1].replace(dateRegex, function (_, month, year) { return month + ' ' + year })
		})
		if (username) listOfMessages = listOfMessages.filter(function (mess) { return username.toUpperCase() !== mess[0].toUpperCase() })
		docLog('List of messages parsed and filtered.')
		return {
			'values': listOfMessages,
			'dates': monthList(listOfMessages, language),
			'names': new Set(listOfMessages.map(function(m) { return m[0] }))
		}
	}

	function getYear(d) {
		// Input: Date in a string format (ex: 'January 2016')
		// Return: Year in the date as Number (ex: 2016)
		return parseInt(d.replace(monthDateRegex, '$2'))
	}

	function getMonth(d) {
		// Input: Date in a string format (ex: 'January 2016')
		// Return: Month in the date as String (ex: January)
		return d.replace(monthDateRegex, '$1')
	}

	function sortMonthFunction (language) {
		return function(val1, val2) {
			var yearComparison = getYear(val1[1]) - getYear(val2[1])
			var monthComparison = months[language].list.indexOf(getMonth(val1[1])) - months[language].list.indexOf(getMonth(val2[1]))
			return yearComparison || monthComparison || 0
		}
	}

	function monthList(messages, language) {
		/* Input: 
		-messages: [['name1', 'Month YEAR'], ['name2', 'Month YEAR'], ...]
		-language: 'en', 'fr'... a key of the months object, defined in the global scope.

		Returns the list of months
		*/

		docLog('Sorting the messages...')
		console.log(messages)
		messages.sort(sortMonthFunction(language))
		console.log(messages)
		console.log(messages[0])
		docLog('Generating a timeline...')
		if (messages.length === 0) {
			return []
		} else {
			var minMonth = messages[0][1]
			console.log(minMonth)
			docLog('Identified first month.')
			var maxMonth = messages[messages.length-1][1]
			docLog('Identified last month.')
			var returnList = [minMonth]
			var currentMonth = new MonthDate(minMonth, language)
			docLog('Iterating on first month...')
			console.log(currentMonth)
			while (currentMonth.toString() !== maxMonth) {
				currentMonth = currentMonth.nextMonth()
				returnList.push(currentMonth)
			}
			docLog('Timeline generated.')
			return returnList
		}
	}

	/*
		GRAPH GENERATION FUNCTIONS
	*/

	function generateNodes (dates, names) {
		/*
		Input:
		- dates: Array of dates as string, in the form 'Month YEAR'
		- names: Set of names
		Return:
		Array of sigma-compatible nodes
		*/
		var nodes = []
		dates.forEach(function(d) {
			nodes.push({
				id: d,
				label: d,
				x: Math.random(),
				y: Math.random(),
				size: Math.random(),
				color: '#FF0000'
			})
		})
		names.forEach(function(n) {
			nodes.push({
				id: n,
				label: n,
				x: Math.random(),
				y: Math.random(),
				size: Math.random(),
				color: '#00FF00'
			})
		})
	}

	function generateEdges (links, dates) {
		/*
		Input:
		- dates: Array of dates as string, in the form 'Month YEAR'
		- names: Array of links, as ['Name NAME', 'Month YEAR']
		Return:
		Array of sigma-compatible edges
		*/
		return []
	}

	function processGraph (m, d, n) {
		/*
			Input:
			- m: Array of messages in the form ['Name NAME', 'Month YEAR']
			- d: Array of dates in the form ['Month YEAR', 'Month YEAR', ...]
			- n: Set of names in the form ['Name NAME', 'Name NAME', ...]
		*/
		var g = { nodes: generateNodes(d, n), edges: generateEdges(m, d) }
		var s = new sigma({
			graph: g,
			container: 'sigma-container'
		})
	}

	/*
		DOM EVENTS AND EXECUTION
	*/

	function docLog (n) {
		$('#notifications').append('<p>' + n + '</p>')
	}

	$(document).ready(function() {
		// Make the interface visible at document load
		$("#loading-line").css('display', 'none')
		$("#file-insert-line").css('display', 'inline')
		for (var lang in months) {
			$('#language').append($('<option value="' + lang + '">' + months[lang].name + '</option>'))
		}
		docLog('Interface ready.')
	})

	$('#file-insert').on('change', function(e) {
		// Save the file
		file = e.target.files[0]
		docLog('File identified.')
	})

	$('#file-insert-line').on('submit', function(e) {
		var name = $('#name').val()
		var lang = $('#language').val()
		e.preventDefault()
		if (!name) return alert('Please insert your Facebook name')
		if (!file) return alert('Please upload a messages.htm')
		docLog('Beginning processing...')
		return processFile(name, file, lang || 'en')
	})
})();