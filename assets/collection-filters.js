// assets/collection-filters.js

document.addEventListener('DOMContentLoaded', () => {
  const productGrid = document.getElementById('product-grid');
  const filterSelects = document.querySelectorAll('[data-filter]');
  const sortSelect = document.getElementById('sort-by');
  if (!productGrid) return;
  // Function to update the product grid with AJAX
  const updateProductGrid = (url) => {
    fetch(`${url}${url.indexOf('?') === -1 ? '?' : '&'}section_id=${productGrid.dataset.sectionId}`) //Add the section ID
      .then((response) => response.text())
      .then((responseText) => {
        const parser = new DOMParser();
        const newDocument = parser.parseFromString(responseText, 'text/html');
        const newGrid = newDocument.getElementById('product-grid').innerHTML;
        const newPagination = newDocument.querySelector('.tw-pagination'); //Get the whole pagination

        productGrid.innerHTML = newGrid;
        // Update pagination separately
        const currentPagination = document.querySelector('.tw-pagination');
        if (currentPagination && newPagination) {
          currentPagination.innerHTML = newPagination.innerHTML;
        } else if (newPagination) {
          //If it is not pagination, but one is returned, add to DOM.
          productGrid.insertAdjacentElement('afterend', newPagination);
        } else if (currentPagination) {
          currentPagination.remove(); //If there isn't pagination returned, remove it
        }

        // Re-attach event listeners (because the DOM elements have been replaced)
        addFilterEventListeners();
        addSortEventListener();
        //Update Browser History
        history.pushState({ page: url }, '', url);
      })
      .catch((error) => {
        console.error('Error fetching product data:', error);
      });
  };

  const filterAndSortProducts = () => {
    let url = new URL(window.location.href);
    let params = new URLSearchParams(url.search);
    // Handle Filters
    filterSelects.forEach((select) => {
      const filterType = select.dataset.filter;
      const filterValue = select.value;
      if (filterValue !== 'all') {
        if (filterType === 'type') {
          params.set('type', filterValue); //Set Type
        }
        if (filterType === 'tag') {
          // Get existing tags from url
          let tags = params.getAll('constraint');

          // Remove empty
          tags = tags.filter((tag) => tag !== '');

          // Add or update the tag filter
          if (!tags.includes(filterValue)) tags.push(filterValue); //Push to array
          params.delete('constraint');
          tags.forEach((tag) => {
            params.append('constraint', tag); //Add all of them
          });
        }
        if (filterType === 'price') {
          params.set('price', filterValue);
        }

        // Add more filter types here
        //params.set(filterType, filterValue); // Old way
      } else {
        // Remove the filter parameter if "All" is selected
        if (filterType === 'type') params.delete('type');
        if (filterType === 'tag') params.delete('constraint'); //Delete constraint
        if (filterType === 'price') params.delete('price');
        //params.delete(filterType); // old way
      }
    });

    // Handle Sorting
    if (sortSelect) {
      //Make sure it exists
      const sortBy = sortSelect.value;
      if (sortBy) {
        params.set('sort_by', sortBy);
      }
    }
    // Construct the new URL *without* the `section_id` parameter in the query string
    const baseUrl = `${window.location.origin}${window.location.pathname}`;
    const newUrl = `${baseUrl}?${params.toString()}`;

    updateProductGrid(newUrl);
  };

  const addFilterEventListeners = () => {
    filterSelects.forEach((select) => {
      select.removeEventListener('change', filterAndSortProducts); //Remove first to avoid duplication
      select.addEventListener('change', filterAndSortProducts);
    });
  };

  const addSortEventListener = () => {
    if (sortSelect) {
      sortSelect.removeEventListener('change', filterAndSortProducts);
      sortSelect.addEventListener('change', filterAndSortProducts);
    }
  };

  // Initial setup
  addFilterEventListeners();
  addSortEventListener();
  // Handle back/forward button
  window.addEventListener('popstate', (event) => {
    if (event.state && event.state.page) {
      updateProductGrid(event.state.page);
    }
  });
});
