import { IonicPage } from 'ionic-angular';
import { Component, Injector } from '@angular/core';
import { Review } from '../../providers/review-service';
import { BasePage } from '../base-page/base-page';

@IonicPage()
@Component({
  selector: 'page-reviews-page',
  templateUrl: 'reviews-page.html'
})
export class ReviewsPage extends BasePage {

  private reviews: Review[];
  private params: any = {};

  constructor(injector: Injector) {
    super(injector);
    this.params.place = this.navParams.data;
  }

  enableMenuSwipe() {
    return false;
  }

  ionViewDidLoad() {
    this.showLoadingView();
    this.onReload();
  }

  loadData() {
    Review.load(this.params).then(reviews => {
      
      for (let review of reviews) {
        this.reviews.push(review);
      }

      this.onRefreshComplete(reviews);

      if (this.reviews.length) {
        this.showContentView();
      } else {
        this.showEmptyView();
      }

    }, error => {
      this.showErrorView();
      this.onRefreshComplete();
    });
  }

  onLoadMore(infiniteScroll) {
    this.infiniteScroll = infiniteScroll;
    this.params.page++;
    this.loadData();
  }

  onReload(refresher = null) {
    this.refresher = refresher;
    this.reviews = [];
    this.params.page = 0;
    this.loadData();
  }

}
