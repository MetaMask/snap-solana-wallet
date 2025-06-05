/**
 * 'initial' - The initial state, where no data has been fetched yet.
 * 'fetching' - The state where data is being fetched.
 * 'fetched' - The state where data has been fetched successfully.
 * 'error' - The state where an error occurred while fetching data.
 */

export type FetchStatus = 'initial' | 'fetching' | 'fetched' | 'error';
