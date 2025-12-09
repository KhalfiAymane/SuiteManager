export class PermissionManager {
    static getSession() {
        return JSON.parse(sessionStorage.getItem('session') || '{}');
    }

    static isAdmin() {
        const session = this.getSession();
        return session.role === 'admin';
    }

    static canCreate() {
        return this.isAdmin();
    }

    static canEdit() {
        return this.isAdmin();
    }

    static canDelete() {
        return this.isAdmin();
    }

    static canView() {
        return true; // Everyone can view
    }

    static init() {
        if (!this.isAdmin()) {
            // Hide all elements marked as admin-only
            document.querySelectorAll('.admin-only').forEach(el => {
                el.style.display = 'none';
            });

            // Hide action buttons in tables (Edit/Delete)
            this.hideCRUDButtons();
        }
    }

    static hideCRUDButtons() {
        // Wait for DOM to be fully loaded and table to be populated
        setTimeout(() => {
            // Remove Edit buttons
            document.querySelectorAll('.action-btn.edit, button.edit, .edit-btn').forEach(btn => {
                btn.style.display = 'none';
            });

            // Remove Delete buttons
            document.querySelectorAll('.action-btn.delete, button.delete, .delete-btn').forEach(btn => {
                btn.style.display = 'none';
            });

            // Check if Actions column is now empty and hide it if needed
            document.querySelectorAll('table').forEach(table => {
                const headerRow = table.querySelector('thead tr');
                const headers = headerRow ? Array.from(headerRow.querySelectorAll('th')) : [];
                
                headers.forEach((th, index) => {
                    if (th.textContent.trim().toLowerCase() === 'actions') {
                        // Check if any row has visible content in this column
                        const rows = table.querySelectorAll('tbody tr');
                        let hasVisibleContent = false;

                        rows.forEach(row => {
                            const cell = row.children[index];
                            if (cell) {
                                const visibleButtons = Array.from(cell.querySelectorAll('button')).filter(
                                    btn => btn.style.display !== 'none'
                                );
                                if (visibleButtons.length > 0) {
                                    hasVisibleContent = true;
                                }
                            }
                        });

                        // If no visible content, hide the entire column
                        if (!hasVisibleContent) {
                            th.style.display = 'none';
                            rows.forEach(row => {
                                if (row.children[index]) {
                                    row.children[index].style.display = 'none';
                                }
                            });
                        }
                    }
                });
            });
        }, 100);
    }

    static can(permission) {
        return this.isAdmin();
    }

    // Call this method after dynamically loading table content
    static refreshPermissions() {
        if (!this.isAdmin()) {
            this.hideCRUDButtons();
        }
    }
}