import InputLabel from '../../../Components/InputLabel';
import InfoField from "../../../Components/InfoField.jsx";
import Avatar from "../../../Components/Avatar.jsx";

export default function ProfileInformation({
                                            user=null,
                                            className = '',
                                           }) {

    return (
        <section className={className}>
            {/*    Если пользователь найден, то отображаем по нему данные */}
            {user && (
                <>
            <header>
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Информация о пользователе
                </h2>

            </header>
            <div className="general-information flex">
                <Avatar email={user?.email} size="xxl" className="me-10 mt-5 hidden sm:block"/>
                <div className="information">
                    <div className="mt-6 space-y-6">
                        <div>
                            <label htmlFor="name" value="Имя пользователя">Имя пользователя</label>

                            <h2
                                id="name"
                                className="mt-1 block break-normal font-bold"
                            >{user?.username}</h2>

                        </div>
                    </div>
                    <div className="mt-6 space-y-6">
                        <h3>
                            <label htmlFor="email">Email</label>
                            <h2
                                id="email"
                                className="mt-1 block break-normal font-bold"
                            
                            >{user?.email}</h2>

                        </h3>
                    </div>

                    <div className="mt-6 space-y-6">
                        <div>
                            <label htmlFor="role">Роль</label>

                            <h2
                                id="role"
                                className="mt-1 block break-normal font-bold"
                            >{user?.admin ? "Админ" : "Психолог"}</h2>
                        </div>
                    </div>
                </div>
            </div>
                </> )}
        </section>
    );
}
