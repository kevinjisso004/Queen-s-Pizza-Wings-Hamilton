// components.js
document.addEventListener('DOMContentLoaded', async function() {
    // Get the current page path
    const currentPath = window.location.pathname;
    const pageName = currentPath.split('/').pop().replace('.html', '') || 'index';
    
    // Calculate the root path based on the current URL
    let rootPath = '.';
    const pathSegments = currentPath.split('/').filter(segment => segment.length > 0);
    if (pathSegments.length > 1) {
      rootPath = '';
      for (let i = 0; i < pathSegments.length - 1; i++) {
        rootPath += '../';
      }
      rootPath = rootPath.slice(0, -1); // Remove trailing slash
    }
    
    // Load header
    const headerContainer = document.querySelector('#header-container');
    if (headerContainer) {
      try {
        const headerResponse = await fetch(`${rootPath}/components/header.html`);
        let headerContent = await headerResponse.text();
        
        // Replace ROOT_PATH placeholders with the actual root path
        headerContent = headerContent.replace(/ROOT_PATH/g, rootPath);
        
        // Insert the header content
        headerContainer.innerHTML = headerContent;

        // Header is present — hide the breadcrumb fallback nav
        document.body.classList.add('header-loaded');

        // publish the header height so sticky elements (menu-page
        // search/category bar) stack exactly beneath it
        const headerEl = headerContainer.querySelector('.site-header');
        const updateHeaderH = () => {
          if (headerEl) {
            document.documentElement.style.setProperty(
              '--header-h',
              headerEl.offsetHeight + 'px'
            );
          }
        };
        updateHeaderH();
        window.addEventListener('resize', updateHeaderH);
        window.addEventListener('load', updateHeaderH);
        
        // Set active class for current page
        const currentNavItem = document.querySelector(`.nav-${pageName}`);
        if (currentNavItem) {
          currentNavItem.classList.add('active');
        }
        
        // Re-initialize menu button functionality
        const menuBtn = document.getElementById("menu-btn");
        const navLinks = document.getElementById("nav-links");
        if (menuBtn && navLinks) {
          const setMenuOpen = (open) => {
            navLinks.classList.toggle("open", open);
            menuBtn.classList.toggle("is-open", open);
            menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
            menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
          };

          menuBtn.addEventListener("click", () => {
            setMenuOpen(!navLinks.classList.contains("open"));
          });

          // close when a link inside the panel is chosen
          navLinks.addEventListener("click", (e) => {
            if (e.target.closest("a")) setMenuOpen(false);
          });

          // close on Escape
          document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") setMenuOpen(false);
          });
        }
      } catch (error) {
        console.error('Error loading header:', error);
      }
    }
    
    // Load footer
    const footerContainer = document.querySelector('#footer-container');
    if (footerContainer) {
      try {
        const footerResponse = await fetch(`${rootPath}/components/footer.html`);
        let footerContent = await footerResponse.text();
        
        // Replace ROOT_PATH placeholders with the actual root path
        footerContent = footerContent.replace(/ROOT_PATH/g, rootPath);
        
        // Insert the footer content
        footerContainer.innerHTML = footerContent;
      } catch (error) {
        console.error('Error loading footer:', error);
      }
    }
  });