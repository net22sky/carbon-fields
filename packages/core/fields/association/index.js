/**
 * External dependencies.
 */
import { Component } from '@wordpress/element';
import { compose, withState } from '@wordpress/compose';
import { withEffects, toProps } from 'refract-callbag';
import {
	cloneDeep,
	find,
	isMatch,
	without
} from 'lodash';
import {
	map,
	pipe,
	merge
} from 'callbag-basics';

class AssociationField extends Component {
	/**
	 * Handles the change of the field.
	 *
	 * @param  {Array} value
	 * @return {void}
	 */
	handleChange = ( value ) => {
		const { field } = this.props;

		this.props.onChange(
			field.base_name,
			value
		);
	}

	handleQueryTermChange = ( queryTerm ) => {
		const { field, onFetchOptions } = this.props;

		field.queryTerm = queryTerm;

		onFetchOptions( queryTerm );
	}

	/**
	 * Handles addition of a new item.
	 *
	 * @param  {Array} option
	 * @return {void}
	 */
	handleAddItem = ( option ) => {
		const { field, value } = this.props;

		// Don't do anything if the duplicates aren't allowed and
		// the item is already selected.
		if ( ! field.duplicates_allowed && option.disabled ) {
			return;
		}

		// Don't do anything, because the maximum is reached.
		if ( field.max > 0 && value.length >= field.max ) {
			// alert( carbonFieldsL10n.field.maxNumItemsReached.replace( '%s', field.max ) );
			return;
		}

		this.handleChange( [
			...value,
			cloneDeep( option )
		] );
	}

	/**
	 * Handles addition of a new item.
	 *
	 * @param  {Array} option
	 * @return {void}
	 */
	handleRemoveItem = ( option ) => {
		const { value } = this.props;

		this.handleChange( without( value, option ) );
	}

	/**
	 * Render the component.
	 *
	 * @return {Object}
	 */
	render() {
		const {
			field,
			value,
			onFetchOptions
		} = this.props;

		onFetchOptions( {
			container_id: field.container_id,
			field_name: field.base_name
		} );

		if ( ! field.duplicates_allowed ) {
			field.options = field.options.map( ( option ) => {
				option.disabled = !! find( value, ( selectedOption ) => isMatch( selectedOption, {
					id: option.id,
					type: option.type,
					subtype: option.subtype
				} ) );

				return option;
			} );
		}

		return this.props.children( {
			field: field,
			value: value,
			handleChange: this.handleChange,
			handleAddItem: this.handleAddItem,
			handleRemoveItem: this.handleRemoveItem,
			handleQueryTermChange: this.handleQueryTermChange
		} );
	}
}

/**
 * The function that controls the stream of side-effects.
 *
 * @return {Function}
 */
function aperture() {
	return function( component ) {
		const [ fetchOptions$, fetchOptions ] = component.useEvent( 'fetchOptions', null );

		const fetchOptionsProps$ = pipe(
			fetchOptions$,
			map( () => toProps( {
				onFetchOptions: fetchOptions
			} ) )
		);

		const fetchOptionsEffect$ = pipe(
			fetchOptions$,
			map( ( payload ) => ( {
				type: 'FETCH_OPTIONS',
				payload: payload
			} ) )
		);

		return merge( fetchOptionsProps$, fetchOptionsEffect$ );
	};
}

/**
 * The function that causes the side effects.
 *
 * @param  {Object} props
 * @return {Function}
 */
function handler( props ) {
	return function( effect ) {
		const { type } = effect;

		switch ( type ) {
			case 'FETCH_OPTIONS':
				// eslint-disable-next-line
				// const request = window.jQuery.get( window.ajaxurl, {
				// 	action: 'carbon_fields_fetch_association_options',
				// 	page: 1,
				// 	term: '',
				// 	container_id: payload.container_id,
				// 	field_name: payload.field_name
				// }, null, 'json' );

				props.setState( [] );

				/* eslint-disable-next-line no-alert */
				// const errorHandler = () => alert( 'An error occurred while trying to fetch association options.' );

				// request.done( ( response ) => {
				// 	if ( response && response.success ) {
				// 		console.log( props );
				// 		const { onAdded, onChange } = props;

				// 		const sidebar = {
				// 			value: response.data.id,
				// 			label: response.data.name
				// 		};

				// 		onAdded( sidebar );
				// 		onChange( effect.payload.fieldKey, sidebar.value );
				// 	} else {
				// 		errorHandler();
				// 	}
				// } );

				// request.fail( errorHandler );
				break;
		}
	};
}

const applyWithState = withState( {
	options: []
} );

const applyWithEffects = withEffects( handler )( aperture );

export default compose(
	applyWithState,
	applyWithEffects
)( AssociationField );
