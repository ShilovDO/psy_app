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
                <Avatar email={user?.email} size="xxl" className="me-10 mt-5"/>
                <div className="information">
                    <div className="mt-6 space-y-6">
                        <div>
                            <InputLabel htmlFor="name" value="Имя пользователя"/>

                            <InfoField
                                id="name"
                                className="mt-1 block"
                                value={user?.username}
                            />

                        </div>
                    </div>
                    <div className="mt-6 space-y-6">
                        <div>
                            <InputLabel htmlFor="email" value="Email"/>
                            <InfoField
                                id="email"
                                className="mt-1 block"
                                value={user?.email}
                            />

                        </div>
                    </div>

                    <div className="mt-6 space-y-6">
                        <div>
                            <InputLabel htmlFor="role" value="Роль"/>

                            <InfoField
                                id="role"
                                className="mt-1 block"
                                value={user?.admin ? "Админ" : "Психолог"}
                            />
                        </div>
                    </div>
                </div>
            </div>
                </> )}
        </section>
    );
}
