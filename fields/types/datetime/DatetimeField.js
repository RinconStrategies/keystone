var React = require('react');
var Field = require('../Field');
var Note = require('../../components/Note');
var DateInput = require('../../components/DateInput');
var moment = require('moment');

module.exports = Field.create({
	
	displayName: 'DatetimeField',

	focusTargetRef: 'dateInput',

	// default input formats
	dateInputFormat: 'YYYY-MM-DD',
	timeInputFormat: 'h:mm:ss a',
	tzOffsetInputFormat: 'Z',

	// parse formats (duplicated from lib/fieldTypes/datetime.js)
	parseFormats: ['YYYY-MM-DD', 'YYYY-MM-DD h:m:s a', 'YYYY-MM-DD h:m a', 'YYYY-MM-DD H:m:s', 'YYYY-MM-DD H:m'],

	getInitialState: function() {
	
		return {
			dateValue: this.props.value ? this.moment(this.props.value).format(this.dateInputFormat) : '',
			timeValue: this.props.value ? this.moment(this.props.value).format(this.timeInputFormat) : '',
			tzOffsetValue: this.props.value ? this.moment(this.props.value).format(this.tzOffsetInputFormat) : moment().format(this.tzOffsetInputFormat),
		};
	},

	getDefaultProps: function() {
		return { 
			formatString: 'Do MMM YYYY, h:mm:ss a'
		};
	},

	moment: function(value) {
		var m = moment(value);
		if (this.props.isUTC) m.utc();
		return m;
	},

	// TODO: Move isValid() so we can share with server-side code
	isValid: function(value) {
		return moment(value, this.parseFormats).isValid();
	},

	// TODO: Move format() so we can share with server-side code
	format: function(value, format) {
		format = format || this.dateInputFormat + ' ' + this.timeInputFormat;
		return value ? this.moment(value).format(format) : '';
	},

	handleChange: function(dateValue, timeValue, tzOffsetValue) {
		var value = dateValue + ' ' + timeValue;
		var datetimeFormat = this.dateInputFormat + ' ' + this.timeInputFormat;

		// if the change included a timezone offset, include that in the calculation (so NOW works correctly during DST changes)
		if (typeof tzOffsetValue !== 'undefined') {
			value += ' ' + tzOffsetValue;
			datetimeFormat += ' ' + this.tzOffsetInputFormat;
		}
		// if not, calculate the timezone offset based on the date (respect different DST values)
		else {
			this.setState({ tzOffsetValue: moment(value, datetimeFormat).format(this.tzOffsetInputFormat) });
		}
		
		this.props.onChange({
			path: this.props.path,
			value: this.isValid(value) ? moment(value, datetimeFormat).toISOString() : null
		});
	},

	dateChanged: function(value) {
		this.setState({ dateValue: value });
		this.handleChange(value, this.state.timeValue);
	},

	timeChanged: function(event) {
		this.setState({ timeValue: event.target.value });
		this.handleChange(this.state.dateValue, event.target.value);
	},

	setNow: function() {
		var dateValue = moment().format(this.dateInputFormat);
		var timeValue = moment().format(this.timeInputFormat);
		var tzOffsetValue = moment().format(this.tzOffsetInputFormat);
		
		this.setState({
			dateValue: dateValue,
			timeValue: timeValue,
			tzOffsetValue: tzOffsetValue
		});
		this.handleChange(dateValue, timeValue, tzOffsetValue);
	},

	renderUI: function() {
		console.log("inside react keystone");
		var input;
		var fieldClassName = 'field-ui';
		if (this.shouldRenderField()) {
			input = (
				<div className={fieldClassName}>
					<DateInput ref="dateInput" name={this.props.paths.date} value={this.state.dateValue} format={this.dateInputFormat} onChange={this.dateChanged} />
					<input type="text" name={this.props.paths.time} value={this.state.timeValue} placeholder="HH:MM:SS am/pm" onChange={this.timeChanged} autoComplete="off" className="form-control time" />
					<button type="button" className="btn btn-default btn-set-now" onClick={this.setNow}>Now</button>
				</div>
			);
		} else {
			input = (
				<div className={fieldClassName}>
					<div className="field-value">{this.format(this.props.value, this.props.formatString)}</div>
				</div>
			);
		}
		return (
			<div className="field field-type-datetime">
				<label className="field-label">{this.props.label}</label>
				{input}
				<input type="hidden" name={this.props.paths.tzOffset} value={this.state.tzOffsetValue} />
				<div className="col-sm-9 col-md-10 col-sm-offset-3 col-md-offset-2 field-note-wrapper">
					<Note note={this.props.note} />
				</div>
			</div>
		);
	}
});
