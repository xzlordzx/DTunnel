class UsersTable {
    constructor(items = []) {
        this.items = items
        this.table = document.createElement('table')
        this.table.classList.add('table', 'table-striped', 'table-hover', 'table-sm', 'text-center')
    }

    render() {
        this.table.innerHTML = `
            <thead>
                <tr>
                    <th>
                        <input class="form-check form-check-input check-item" type="checkbox">
                    </th>
                    <th>ID</th>
                    <th>NOME</th>
                    <th>URL</th>
                    <th>STATUS</th>
                    <th>AÇÕES</th>
                </tr>
            </thead>
            <tbody>
            </tbody>
        `

        this.table.querySelector('.check-item').addEventListener('click', e => this.checkAll(e.target.checked));
        const tbody = this.table.querySelector('tbody')
        this.items.forEach(item => tbody.appendChild(item.render()))

        const div = document.createElement('div')
        div.classList.add('table-responsive')
        div.appendChild(this.table)
        return div
    }

    getCheckedItems() {
        return this.items.filter(item => item.isChecked())
    }

    checkAll(checked) {
        this.items.forEach(item => item.check(checked))
    }
}

class TableItem {
    constructor(user) {
        this.user = user
        this.element = document.createElement('tr')

        this.onClickDelete = null
        this.onClickEdit = null
    }

    setOnClickDelete(fn) {
        this.onClickDelete = fn
    }

    setOnClickEdit(fn) {
        this.onClickEdit = fn
    }

    render() {
        this.element.innerHTML = `
            <td>
                <input class="form-check form-check-input check-item" type="checkbox" value="${this.user.id}">
            </td>
            <td>${this.user.id}</td>
            <td>${this.user.name}</td>
            <td>${this.user.url}</td>
            <td>
                <span class="badge text-bg-${this.user.status == 'ACTIVE' ? 'success' : 'danger'} rounded-pill">
                    ${this.user.status == 'ACTIVE' ? 'ATIVO' : 'INATIVO'}
                </span>
            </td>
            <td>
            <button class="btn btn-sm btn-dark mb-1">
                <i class="bi bi-pencil-square"></i>
            </button>
            <button href="#" class="btn btn-sm btn-dark mb-1">
                <i class="bi bi-trash"></i>
            </button>
            </td>
        `

        this.setupButtons()
        return this.element
    }

    setupButtons() {
        const btnDelete = this.element.querySelector('.btn-dark:last-child')
        btnDelete.addEventListener('click', event => {
            event.preventDefault()
            if (this.onClickDelete) this.onClickDelete(this.user)
        })

        const btnEdit = this.element.querySelector('.btn-dark:first-child')
        btnEdit.addEventListener('click', event => {
            event.preventDefault()
            if (this.onClickEdit) this.onClickEdit(this.user)
        })
    }

    isChecked() {
        return this.element.querySelector('input[type="checkbox"]').checked
    }

    check(checked = true) {
        this.element.querySelector('input[type="checkbox"]').checked = checked
    }
}

export default UsersTable
export { TableItem }