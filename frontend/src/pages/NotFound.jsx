import { Link } from 'react-router-dom';
import PrimaryButton from "../Components/PrimaryButton.jsx";
import {Helmet} from "react-helmet";

export default function NotFound() {
  return (
    <div className="text-center pt-10 mt-5 text-3xl overflow-hidden flex items-center justify-center flex-col gap-3">
        <Helmet>
            <title>Not found</title>
        </Helmet>
      <h1 className="">404</h1>

      <h2 className="text-2xl">Страница не найдена</h2>
      <p>
        <Link to="/" className="">

            <PrimaryButton className="text-2xl">
                Вернуться на главную
            </PrimaryButton>
        </Link>
      </p>
    </div>
  );
}