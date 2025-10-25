import UsersTable, { TableItem } from "./components/table.js";
import Cdn from "./models.js";

import { Observable } from "../common/observer.js";
import { Observer } from "../common/observer.js";

import { ButtonAdd, ButtonDelete } from "./components/buttons.js";
import { UsersForm, UsersModal } from "./modals/users.js";
import Status from "./components/status.js";
import Pagination from "../common/pagination.js";

import NoFoundUsers from "./errors/NoFoundUsers.js";
import { InternalError } from "../common/errors.js";

class UsersList extends Observable {
    constructor(users = []) {
        super();
        this.users = users
        this.orderBySorter()
    }

    orderBySorter() {
        this.users.sort((a, b) => a.sorter - b.sorter)
    }

    add(user) {
        if (!user.id) user.id = "";
        this.users.push(user)
        this.orderBySorter()
        this.notify('add', user)
    }

    remove(user) {
        this.users = this.users.filter(c => c.id !== user.id)
        this.orderBySorter()
        this.notify('remove', user)
    }

    update(user) {
        this.users = this.users.map(c => c.id === user.id ? user : c)
        this.orderBySorter()
        this.notify('update', user)
    }

    getById(id) {
        return this.users.find(c => c.id === id)
    }

    getByStatus(status) {
        return this.users.filter(c => c.status === status)
    }

    static fromJson(data) {
        return new UsersList(data.map(Cdn.fromJson))
    }
}

const showSpinner = root => {
    const spinner = `
        <div class="d-flex justify-content-center p-5 __spinner">
            <div class="spinner-border p-5" role="status"></div>
        </div>
    `
    root.innerHTML = spinner
}

let csrfToken = getCsrfTokenHead();

const main = async () => {
    const root = document.getElementById('root')
    showSpinner(root)

    const status = new Status()
    const pagination = new Pagination(document.querySelector('#pagination'))

    status.setOnChange(() => render())
    status.render()

    const getusers = async () => {
        try {

            const response = await fetch(`/user_list?offset=${pagination.offset}&limit=${pagination.limit}`, {
                headers: {}
            })

            const data = await response.json()

            pagination.offset = data.data.offset
            pagination.limit = data.data.limit
            pagination.total = data.data.total
            pagination.mount()

            return UsersList.fromJson(data.data.result)

        } catch (e) {
            const internalError = new InternalError(document.querySelector('.card', e.message))
            internalError.render()
            throw e
        }
    }

    const UsersList = await getusers()
    pagination.setOnPageChange(async () => {
        showSpinner(root);
        UsersList.users = (await getusers()).users
        render()
    })

    const render = () => {
        root.innerHTML = ''
        const users = status.getValue() === 'ALL' ?
            UsersList.users :
            UsersList.getByStatus(status.getValue())

        if (users.length === 0) {
            const NoFoundUsers = new NoFoundUsers(root)
            NoFoundUsers.render()
            return
        }

        const items = users.map(c => {
            const item = new TableItem(c)

            item.setOnClickDelete(() => {
                showAlertConfirm(() => UsersList.remove(c))
            })

            item.setOnClickEdit(() => {
                const form = new UsersForm(c)
                const modal = new UsersModal(form)

                modal.setOnSave(() => {
                    if (!form.validate()) return
                    UsersList.update(c)
                    modal.hide()
                })
                modal.show()
            })

            return item
        })

        const table = new UsersTable(items)
        root.appendChild(table.render())

        const btnDelete = new ButtonDelete()
        btnDelete.setOnClick(() => {
            const items = table.getCheckedItems()
            items.forEach(item => UsersList.remove(item.user))
        })

    }

    UsersList.register(new Observer('add', async user => {

        render()
        //showToastInfo(`Crinado CDN ${user.name}...`)

        const response = await fetch('/user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(user)
        });

        const data = await response.json()

        if (response.status == 201) {
            user.id = data.user_id;
            showToastSuccess(`CDN ${user.name} criada com sucesso!`)
            render()
            return
        }

        showToastError(`Erro ao criar CDN ${user.name}!`)
        UsersList.remove(user)
        render()
    }))

    UsersList.register(new Observer('remove', async user => {
        render()

        // showToastInfo(`Removendo CDN ${user.name}...`)

        try {

            const response = await fetch(`/user/${user.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.status == 204) {
                showToastSuccess(`CDN ${user.name} removida com sucesso!`)
                return
            }

            const data = await response.json();
            if (data.message) {
                showToastError(data.message);
                return
            }

        } catch (err) {
            showToastError(`Erro ao remover CDN ${user.name}!`)
        }

        render()
    }))

    UsersList.register(new Observer('update', async user => {
        render()

        //showToastInfo(`Atualizando categoria ${user.name}...`)

        const response = await fetch(`/user/${user.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(user)
        });

        const csrfTokenRefresh = getCsrfTokenRefresh(response);
        if (csrfTokenRefresh) csrfToken = csrfTokenRefresh;

        const data = await response.json();

        if (data.status == 200) {
            showToastSuccess(`CDN ${user.name} atualizada com sucesso!`)
            return;
        }

        showToastError(`Erro ao atualizar CDN ${user.name}!`)
    }))

    const btnAdd = new ButtonAdd()
    btnAdd.setOnClick(() => {
        const user = new Cdn(null, '', '', 'ACTIVE', 1)
        const form = new UsersForm(user)
        const modal = new UsersModal(form)

        modal.setOnSave(() => {
            if (!form.validate()) return
            UsersList.add(user)
            modal.hide()
        })

        modal.show()
    });

    render()
}

main()