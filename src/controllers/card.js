import { Card } from "../components/card";
import { CardEdit } from "../components/card-edit";
import { render } from "../components/utils";
import flatpickr from "flatpickr";

export const CardMode = {
  add: `adding`,
  default: `default`,
};

export const TaskActions = {
  delete: `delete`,
  update: `update`,
  create: `create`,
};

export const CardState = {
  READY: "READY",
  LOADING: "LOADING",
};

export class CardController {
  constructor(container, data, onDataChange, onChangeView, mode) {
    this._container = container;
    this._data = data;
    this._mode = mode;
    this._card = new Card(data);
    this._cardEdit = new CardEdit(data);
    this._currentColor = this._data.color;
    this._currentView = null;
    this._btnCardSave = this._cardEdit
      .getElement()
      .querySelector(`.card__save`);
    this._btnCardDelete = this._cardEdit
      .getElement()
      .querySelector(`.card__delete`);
    this._cardInner = this._cardEdit.getElement().querySelector(`.card__inner`);

    this._onDataChange = onDataChange;
    this._onChangeView = onChangeView;
    this.create();
  }

  create() {
    this._currentView = this._card;

    if (this._mode === CardMode.add) {
      this._currentView = this._cardEdit;
    }

    const date = this._cardEdit.getElement().querySelector(`.card__date`);

    if (Array.from(date.classList).includes(`flatpickr-input`)) {
      return;
    } else {
      flatpickr(date, {
        altInput: true,
        allowInput: true,
        defaultDate: this._data.dueDate,
      });
    }

    const onEscKeyDown = (evt) => {
      if (evt.key === `Escape` || evt.key === `Esc`) {
        if (this._mode === CardMode.default) {
          if (this._container.contains(this._cardEdit.getElement())) {
            this._container.replaceChild(
              this._card.getElement(),
              this._cardEdit.getElement()
            );
          }
        } else if (this._mode === CardMode.add) {
          this._container.removeChild(this._currentView.getElement());
        }

        document.removeEventListener(`keydown`, onEscKeyDown);
      }
    };

    this._card
      .getElement()
      .querySelector(`.card__btn--edit`)
      .addEventListener(`click`, () => {
        this._onChangeView();
        this._container.replaceChild(
          this._cardEdit.getElement(),
          this._card.getElement()
        );
        document.addEventListener(`keydown`, onEscKeyDown);
      });

    this._cardEdit
      .getElement()
      .querySelector(`textarea`)
      .addEventListener(`focus`, () => {
        document.removeEventListener(`keydown`, onEscKeyDown);
      });

    this._cardEdit
      .getElement()
      .querySelector(`textarea`)
      .addEventListener(`blur`, () => {
        document.addEventListener(`keydown`, onEscKeyDown);
      });

    this._btnCardDelete.addEventListener(`click`, (evt) => {
      const { stateText } = evt.target.dataset;
      this.setState(CardState.LOADING);
      this._btnCardDelete.textContent = stateText;

      this._onDataChange(TaskActions.delete, this._data, () =>
        this.setState(CardState.READY)
      );
    });

    this._btnCardSave.addEventListener(`click`, (evt) => {
      evt.preventDefault();
      const { stateText } = evt.target.dataset;

      const formData = new FormData(
        this._cardEdit.getElement().querySelector(`.card__form`)
      );

      this._data.description = formData.get(`text`);
      this._data.color = formData.get(`color`);
      this._data.tags = new Set(formData.getAll(`hashtag`));
      this._data.dueDate = new Date(formData.get(`date`));
      this._data.dueTime = this._data.dueTime;
      this._data.isRepeat = this._cardEdit._isRepeat;
      this._data.isDate = this._cardEdit._isDate;
      this._data.repeatingDays = formData.getAll(`repeat`).reduce(
        (acc, it) => {
          acc[it] = true;
          return acc;
        },
        {
          mo: false,
          tu: false,
          we: false,
          th: false,
          fr: false,
          sa: false,
          su: false,
        }
      );

      this.setState(CardState.LOADING);
      this._btnCardSave.textContent = stateText;

      this._onDataChange(
        this._mode === CardMode.add ? TaskActions.create : TaskActions.update,
        this._data,
        () => this.setState(CardState.READY)
      );

      document.removeEventListener(`keydown`, onEscKeyDown);
    });

    this._cardEdit
      .getElement()
      .querySelector(`.card__colors-wrap`)
      .addEventListener(`click`, (evt) => {
        if (evt.target.tagName !== `INPUT`) {
          return;
        }

        const classDomList = this._cardEdit.getElement().classList;
        classDomList.remove(`card--${this._currentColor}`);
        classDomList.add(`card--${evt.target.value}`);
        this._currentColor = evt.target.value;
      });

    render(this._container, this._currentView.getElement());
  }

  /* eslint-disable */
  setState(state) {
    this._cardInner.classList.remove(`border-error`);
    this._cardEdit.getElement().classList.remove("shake");

    this._cardEdit.getElement().querySelector(`.card__text`).disabled =
      state === CardState.LOADING;
    this._btnCardSave.disabled = state === CardState.LOADING;
    this._btnCardDelete.disabled = state === CardState.LOADING;

    if (state === CardState.READY) {
      this._cardInner.classList.add(`border-error`);
      this._cardEdit.getElement().classList.add(`shake`);

      this._btnCardSave.textContent = `save`;
      this._btnCardDelete.textContent = `delete`;
    }
  }

  setDefaultView() {
    if (this._container.contains(this._cardEdit.getElement())) {
      this._container.replaceChild(
        this._card.getElement(),
        this._cardEdit.getElement()
      );
    }
  }
}
