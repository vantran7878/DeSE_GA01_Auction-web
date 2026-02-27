function initDeleteConfirm(actionUrl, itemLabel) {
    // Xử lý sự kiện nút xóa
    $('.btn-delete').on('click', function(e) {
        e.preventDefault();
        const id = $(this).data('id');
        const name = $(this).data('name');
        const form = $('#formDelete');
        
        form.attr('action', `${actionUrl}`); 
        $('#txtDeleteId').val(id);
        
        Swal.fire({
            title: 'Are you sure?',
            text: name ? `You are about to delete ${itemLabel}: "${name}". This action cannot be undone!`
            : `You won't be able to revert this! This ${itemLabel} will be permanently deleted.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                form.submit();
            }
        });
    });
}