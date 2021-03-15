import React from 'react';
import './App.css';
import { DrinkList } from './drinks/DrinkList';
import { IDrinkAmount, IDrink } from "../../types";
import { Banner } from './basic/Banner';
import { Spinner } from './basic/Spinner';
import SearchForm from './searchform/searchform';

const drinkAmounts = [
  { 
    drink: { 
      name: "Bloody Mary",
      description: "An english original",
      ingredients: [{ name: "Tomato"}],
      instructions: []
    }, 
    amount: 2 
  },
  { 
    drink: { 
      name: "Kolakorn",
      description: "An english original",
      ingredients: [{ name: "Coca-Cola" }, { name: "Korn" }, { name: "Eis"}],
      instructions: ["Korn und Kola mischen", "Eiswürfel hinzugeben"]
    }, 
    amount: 3 
  }
];

function App() {
  const [state, setState] = React.useState<{ pending?: true, loading?: true, result?: IDrinkAmount[], error?: string  }>({ pending: true });

  async function startRecomendation(query: { ingredients: string[], weight: number, }) {
    setState({ loading: true });

    // TODO: Call backend here
    await new Promise(res => setTimeout(res, 1_000));

    setState({ result: drinkAmounts });
  }


  if(state.loading) {
    return (
      <Container>
        <Spinner />
      </Container>
    );
  }

  if(state.error) {
    return (
      <Container>
        <Banner.Warning title="An error occurred" text={state.error} />
      </Container>
    )
  }

  if(state.pending) {
    return (
      <Container>
        <SearchForm submit={(weight, ingredients) => startRecomendation({ ingredients, weight })} />
      </Container>
    )
  }


  return (
    <Container>
      <DrinkList drinkAmounts={drinkAmounts} />
    </Container>
  );
}

function Container({ children }: React.PropsWithChildren<{}>) {
  return <div className="app">
    <div className="app-title">Get me drunk</div>
    {children}
  </div>
}

export default App;
